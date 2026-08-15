# Eventos del perfil: inscritos y asistencias

Describe cómo el perfil propio lista eventos de **Utopp Formulario** en los que el
email del usuario figura como asistente. No hay tabla espejo ni job de sync:
es un JOIN on-read contra `formulario.attendees`.

## Intent

- Mostrar en `/app` → perfil propio dos bloques: **Mis eventos** (inscrito, vigente)
  y **Asistencias** (check-in permanente).
- Vincular por email, no por `user_id`. Un guest de Formulario que luego crea
  cuenta Utopp con el mismo correo ve esos eventos **sin backfill**.
- El clic de la tarjeta abre el **boleto** (`/ticket/{id}`), no el detalle de
  la página Eventos. Eso **no** dispara `event_viewed`.

## Arquitectura

```
Estudiante (perfil propio)
        │
        ▼
StudentProfilePage
  getMyParticipatedEvents({ size: 50 })
        │
        ▼
GET /users/me/events
        │
        ▼
list_my_participated_events(email)
        │
        ├─ formulario.attendees  (email, case-insensitive)
        ├─ formulario.events     (excluye is_draft)
        └─ formulario.tickets    (checked_in, ticket_id)
                    │
                    ▼
         ticket_url = {UF_FRONTEND_URL}/ticket/{ticket_id}
                    │
                    ▼
StudentProfileSelf
  registered → "Mis eventos"
  attended   → "Asistencias" + métrica Asistencia
  href       → publicFormularioHref(ticket_url)
```

Fuente: `app/services/user_events_service.py`. El schema `formulario` es de
Utopp Formulario; Plataforma solo tiene `SELECT` en `attendees` / `tickets`.

## Contrato público

### `GET /users/me/events`

Auth: cookie/JWT + términos aceptados (`require_terms_accepted`).

Solo el usuario autenticado. No existe `GET /users/{id}/events`; el perfil
público (`StudentProfilePublic`) no muestra inscritos ni asistencias.

| Query | Default | Notas |
|-------|---------|-------|
| `page` | `1` | `ge=1` |
| `size` | `20` | `1…100`. El perfil pide `50`. |
| `status` | omitido | `registered` \| `attended` |

Respuesta: **lista plana** (`List[UserParticipatedEventOut]`), no `PageResponse`.
No hay `total` / `has_next`.

```json
[
  {
    "event_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "title": "Hackathon Utopp",
    "date_time": "2026-08-20T18:00:00Z",
    "location": "UTEC",
    "banner_url": null,
    "category": "tech",
    "theme": "violet",
    "registered_at": "2026-08-01T12:00:00Z",
    "checked_in": false,
    "checked_in_at": null,
    "status": "registered",
    "ticket_id": "11111111-2222-3333-4444-555555555555",
    "ticket_url": "http://localhost:5174/ticket/11111111-2222-3333-4444-555555555555"
  }
]
```

| `status` | Condición |
|----------|-----------|
| `registered` | `checked_in = false` |
| `attended` | `checked_in = true` (QR escaneado en Formulario) |

Filtro `status=registered` exige además `date_time >= NOW()` (alineado con la
visibilidad). `status=attended` no exige fecha futura.

## Visibilidad

Una fila entra al listado si **no es borrador** y:

```
checked_in  OR  date_time >= NOW()
```

| Caso | ¿Se ve? |
|------|---------|
| Inscrito, evento futuro, sin check-in | Sí → `registered` |
| Inscrito, evento vencido, sin check-in | **No** (no-show) |
| Check-in, evento futuro o pasado | Sí → `attended` (permanente) |
| `is_draft = true` | No |
| Schema `formulario` ausente / sin permiso | `[]` (rollback, sin 500) |
| Dialecto distinto de PostgreSQL | `[]` |
| Email vacío o solo espacios | `[]` (no ejecuta SQL) |

## Deduplicación

Inscripciones viejas pueden dejar **varios attendees o boletos** para el mismo
evento. El SQL usa `DISTINCT ON (e.id)` priorizando:

1. `checked_in DESC` (gana el boleto con asistencia)
2. `registered_at ASC`
3. `ticket_id ASC NULLS LAST`

El servicio y `getMyParticipatedEvents` vuelven a colapsar por `event_id` y
prefieren `attended` si llega más de una fila. El perfil muestra **una tarjeta
por evento**.

## URLs de boleto

`ticket_url` se construye con `settings.UF_FRONTEND_URL` (default local
`http://localhost:5174`). **El backend no reescribe localhost en Render**
(a diferencia de `GOOGLE_REDIRECT_URI` / `FRONTEND_URL`).

En producción, si el API sigue emitiendo `:5174`, el cliente reescribe el href
con `canonicalizeUtoppFormularioUrl` → `https://www.forms.utopp.app` cuando la
SPA corre en `utopp.app` / hosts Render conocidos.

También canoniza `forms.utopp.app` y el host legacy `formulario.utopp.app` a
`www.forms.utopp.app` (el apex hace 301 y puede perder query params).

Sin `ticket_id` la tarjeta no es enlace.

## Qué no es este endpoint

| | `GET /users/me/events` | `GET /events` | `POST /analytics/events` `event_viewed` |
|---|---|---|---|
| Fuente | `attendees` del email | Catálogo `formulario.events` | Modal de detalle |
| Auth | Sesión + términos | Pública | Alumno |
| UI | Perfil propio | Página Eventos | `EventDetailModal` |
| Link | `/ticket/{id}` | `/e/{id}` (inscripción) | — |

Runbook del catálogo (visibilidad, `is_draft`, creación):
[shared-events-catalog.md](shared-events-catalog.md).

`eventSavedPosts` del perfil son posts de tipo `event` **guardados** en
Plataforma (`saved_posts`), no inscritos de Formulario.

## Pitfalls

- **Email distinto = invisible.** Si se inscribieron con otro correo (o typo),
  el JOIN no los encuentra. No hay `utopp_user_id` en attendees.
- **Paginación opaca.** El cliente pide 50 ítems y no pagina. Más de 50
  eventos visibles se cortan en silencio.
- **Lista vacía ≠ error.** Schema faltante, SQLite en tests o permiso denegado
  devuelven `[]`. El perfil muestra el empty state, no un toast.
- **localhost en boletos.** Fijar `UF_FRONTEND_URL=https://www.forms.utopp.app`
  en el backend de Render. El rewrite del cliente es red de seguridad, no
  sustituto. Ver [docs/deploy/RENDER_OAUTH.md](../../docs/deploy/RENDER_OAUTH.md).
- **No-shows desaparecen.** Tras `date_time` un inscrito sin QR deja de listarse;
  no es un bug de “se perdió la inscripción”.
- Tests de contrato: `Utopp-Testing/test_user_events.py` (mocks, sin Postgres).
