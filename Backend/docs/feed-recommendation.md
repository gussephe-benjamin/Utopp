# Feed recomendado: scoring Nivel 1 y personalización Nivel 2

Describe cómo `GET /feed?sort=recommended` (UI **Para ti**) ordena publicaciones.
No hay cola ni worker: el score se calcula en el request; los pesos se ajustan
en el mismo request de like / comentario / guardado.

## Intent

- Ordenar el feed no pineado por relevancia heurística (intereses, follows,
  recencia, engagement, deadline), no solo por fecha.
- Aprender **pesos** por `(usuario, post_type, factor)` a partir de
  interacciones explícitas, con clamp y umbral de evidencia.
- No tocar el orden de publicaciones **prioritarias** (`is_pinned`).
- Un fallo en personalización **no** debe revertir el like / comentario / save.

## Arquitectura

```
SPA  Publicaciones  (exclude_type=event)
  filtros: Urgencia | Recientes | Para ti
        │
        ▼
GET /feed?sort=recommended&exclude_type=event&page=&size=
        │
        ▼
build_feed()                         feed_service.py
  1. SQL: published + filtros
     ORDER BY pin, urgencia|reciente
     OFFSET/LIMIT  ← pagina ANTES de scorear
  2. si sort=recommended:
       load_weight_adjustments(user)
       rank_posts()                  recommendation_service.py
         pineados: pin_priority, sin score
         resto: score_post(features × pesos)
        │
        ▼
FeedPostOut.relevance_score
           .score_breakdown
        │
        ▼
PostCard → ScoreExplanation

Like / comment / save (después del commit de la interacción)
        │
        ▼
record_interaction()                 weight_adjustment_service.py
  EMA sobre interest_overlap,
  social_proximity, engagement
        │
        ▼
user_weight_adjustments
```

Lectura: `recommendation_service` (funciones puras + `load_weight_adjustments`).
Escritura: `weight_adjustment_service.record_interaction` (best-effort, commit
propio). No confundir con `analytics/personalization_service.py` — **no tiene
callers**.

## Contrato público

### `GET /feed`

Auth: opcional (`get_optional_user`). Sin sesión: Nivel 1 con intereses y
follows vacíos; sin Nivel 2. Enriquecimiento (`is_saved`, `user_reacted`) solo
con usuario.

| Query | Default | Notas |
|-------|---------|-------|
| `sort` | omitido = **urgencia** | `recent` \| `recommended`. Cualquier otro valor = urgencia. |
| `exclude_type` | — | La SPA de Publicaciones manda `event`. |
| `type`, `subtype`, `tags`, `time_status` | — | Igual que el feed normal. Tags: OR (`jsonb @>`). |
| `page` | `1` | |
| `size` | `20` (API) / **`10` (SPA)** | `1…100` |

La SPA (`useFeed`) mapea: `urgency` → omite `sort`; `recent` / `recommended`
se envían tal cual. Default UI: **Urgencia**, no Para ti.

Respuesta extra **solo** con `sort=recommended` y posts no pineados:

```json
{
  "relevance_score": 0.42,
  "score_breakdown": {
    "interest_overlap": 0.12,
    "social_proximity": 0.0,
    "recency": 0.08,
    "engagement": 0.05,
    "urgency": 0.17,
    "availability_match": 0.0
  }
}
```

Pineados: ambos campos `null`. `ScoreExplanation` no renderiza sin score.

### Escritura (sin endpoint propio)

No hay `POST /recommendations`. Los deltas se escriben desde:

| Interacción | Servicio | `event_type` | ¿La SPA lo dispara hoy? |
|-------------|----------|--------------|-------------------------|
| Me gusta (al **activar**) | `reaction_service` | `liked` (0.3) | Sí (`PostCard`) |
| Comentario | `comment_service` | `commented` (0.45) | Sí |
| Guardar | `saved_post_service` | `saved` (0.5) | Sí |
| Participar en post `event` | `participant_service` | `interested` 0.4 / `going` 0.6 / `attended` 1.0 | **No** — `participate()` no tiene callers |

Quitar like, unsave, borrar comentario o bajar participación **no** resta
evidencia. Participación Formulario (`/e/{id}`) **no** llama a
`record_interaction`.

## Score Nivel 1

`score = Σ feature_i × weight_i`. Features en `[0, 1]`. Pesos por `post_type`
en `WEIGHT_PROFILES` (suman 1.0; `availability_match` siempre 0).

| Factor | Cómo se calcula | ¿Nivel 2 lo mueve? |
|--------|-----------------|--------------------|
| `interest_overlap` | `\|tags ∩ intereses\| / \|tags\|` (0 si no hay tags) | Sí |
| `social_proximity` | 1 si el usuario sigue al autor, si no 0 | Sí |
| `recency` | `exp(-ln2 × horas / 48)` | No |
| `engagement` | `log1p(likes + 2×comentarios) / log1p(50)`, cap 1 | Sí |
| `urgency` | 1 cerca del deadline, 0 a ≥14 días, vencido o sin fecha | No |
| `availability_match` | Siempre 0 (`Post` no tiene horario de evento) | No (peso 0) |

Pesos base:

| `post_type` | overlap | social | recency | engagement | urgency |
|-------------|---------|--------|---------|------------|---------|
| `event` | 0.30 | 0.15 | 0.15 | 0.15 | 0.25 |
| `international_opportunity` | 0.35 | 0.10 | 0.10 | 0.10 | 0.35 |
| `academic_project` | 0.40 | 0.20 | 0.20 | 0.20 | 0 |
| `simple_post` | 0.35 | 0.30 | 0.25 | 0.10 | 0 |
| `announcement` | 0.20 | 0.10 | 0.40 | 0.10 | 0.20 |

`rank_posts`: pineados por `pin_priority DESC, created_at DESC` (sin scorear);
el resto por `score DESC, created_at DESC`.

## Personalización Nivel 2

Tabla `user_weight_adjustments`: una fila por `(user_id, post_type, factor)`.

Al interactuar, para cada factor ajustable se toma el **feature del post en
ese instante** (no “le gustó el tag X”). EMA:

```
delta' = delta + 0.15 × signal_strength × (target − delta)
```

| Feature | Target |
|---------|--------|
| ≥ 0.5 | `+1.0` (refuerza) |
| ≤ 0.2 | `−0.5` (debilita, menor magnitud) |
| `(0.2, 0.5)` | **no actualiza** esa fila |

Al leer el feed, `effective_delta`:

1. `evidence_count < 5` → 0 (cold start)
2. `last_event_at` hace más de **30 días** → 0
3. Shrinkage: `delta_ema × 0.5^(días_inactivos / 14)`
4. Peso: `base × (1 + 0.30 × delta)`, luego **renormaliza** a suma 1.0

Aislado por `post_type`: un like a un `simple_post` no mueve convocatorias.

## Paginación vs ranking (constraint)

El SQL pagina **antes** de `rank_posts`. Con `sort=recommended` el ORDER BY
sigue siendo el de **urgencia** (porque no es `recent`). Para ti **reordena
la página actual**, no el corpus.

La SPA pide `size=10`. Los pines de esa página siguen arriba; el resto se
reordena entre sí. Página 2 no “sube” un post muy relevante que quedó fuera
del corte de urgencia.

## Qué no es este sistema

| | Feed `sort=recommended` | Analytics `POST /analytics/events` | `personalization_service.py` |
|---|---|---|---|
| Propósito | Ordenar publicaciones | KPIs admin / sesiones | Código muerto |
| Señal | like / comment / save (y participate API) | `event_viewed`, `post_liked`, … | `like_rate` / `comment_rate` — **sin callers** |
| Tabla | `user_weight_adjustments` | `activity_events` | Misma tabla, factores distintos e incompatibles |

`event_viewed` y el perfil (`GET /users/me/events`) no entrenan Nivel 2.

## Cómo probar en local

Unitario (sin API ni Postgres):

```bash
cd Utopp-Testing
pytest test_recommendation_score.py test_weight_adjustment.py -v
```

E2E opcional, **solo local** (`ensure_local_dev_environment` aborta si detecta
Render o un `DATABASE_URL` remoto):

```bash
python Backend/app/scripts/simulate_interactions.py --host 127.0.0.1
```

Mint de JWT + like/save/comment en posts `[TEST] `; compara `GET /feed?sort=recommended`
antes/después. Default `--email esteban@utec.edu.pe`.

## Pitfalls

- **Re-rank por página.** No es un ranking global. Subir `size` cambia el
  conjunto candidato; no asumas que página 1 son “los 10 más relevantes del
  sitio”.
- **Default no es Para ti.** Sin `sort` (o con Urgencia) el score no se calcula
  y `relevance_score` es `null`.
- **Cold start 5 eventos.** Menos de 5 actualizaciones en un factor → peso
  base. La zona ambigua no cuenta.
- **Unlike no desaprende.** Solo el like que se **pone** escribe. Lo mismo
  unsave / borrar comentario.
- **Eventos del catálogo Formulario no entrenan.** `exclude_type=event` saca
  esos posts del feed de Publicaciones; `participate()` no se usa en la SPA.
  Nivel 2 de `post_type=event` casi no recibe señal de producto.
- **`apply_personalization_signal` no está vivo.** Escribir factores
  `like_rate` rompería `ADJUSTABLE_FACTORS` (`interest_overlap`, etc.).
- **Best-effort.** Si `record_interaction` falla, log + rollback de esa
  transacción; el like ya está committed.
- **Anonymous / staff.** Sin usuario no hay deltas. Staff sí puede tener
  filas si da like (no hay filtro de rol aquí; el de analytics es otro).
- Tests: `Utopp-Testing/test_recommendation_score.py` (Nivel 1),
  `test_weight_adjustment.py` (Nivel 2). No hay test de contrato HTTP de
  `sort=recommended`.
