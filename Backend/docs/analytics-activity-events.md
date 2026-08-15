# Analytics: eventos de actividad de alumnos

Describe cómo Utopp registra actividad de **estudiantes** y cómo el dashboard de métricas la consume. La fuente de verdad del allowlist es `app/services/analytics/constants.py` (`ALLOWED_EVENT_TYPES`).

## Intent

- Medir uso real (sesiones, páginas, engagement) para `/app/admin/metricas`.
- No trackear staff: admin, root, oficina y demás roles con más de un rol se ignoran.
- Fallar en silencio en el cliente: un error de analytics no debe romper la UI.

## Arquitectura

```
Estudiante (SPA)
    │
    ├─ AnalyticsProvider          app_opened, page_view, feed_viewed, session_ended
    ├─ PublicationWizard          post_created
    ├─ PostCard                   post_viewed (throttle), post_liked
    ├─ PostCommentsSection        post_commented
    ├─ EventDetailModal           event_viewed (throttle 1 h)
    └─ AuthContext / POST /logout logout
                    │
                    ▼
         POST /analytics/events
                    │
                    ▼
         track_activity_event()
            ├─ sanitiza metadata
            ├─ escribe activity_events
            └─ abre / cierra user_sessions
                    │
                    ▼
         GET /admin/analytics/*
            (solo admin/root)
```

Tablas: `activity_events` (`ActivityEvent`) y `user_sessions` (`UserSession`).

## Quién se trackea

`is_student_user` considera alumno a:

- usuario **sin roles**, o
- usuario con **exactamente un** rol `estudiante`.

Cualquier otro caso (admin, root, oficina, organización, o alumno + otro rol):

- el frontend **no envía** (`AnalyticsProvider` pone `enabled = false`);
- `POST /analytics/events` responde **204** sin persistir.

El endpoint exige sesión + consentimiento legal (`require_terms_accepted`). Sin términos vigentes: **403** `TERMS_RECONSENT_REQUIRED`.

## Contrato público

### `POST /analytics/events`

Auth: cookie/JWT + términos aceptados.

```json
{
  "event_type": "event_viewed",
  "metadata": { "event_id": "uuid-del-evento-compartido" }
}
```

| Respuesta | Cuándo |
|-----------|--------|
| `200` `{ "success": true }` | Alumno y `event_type` permitido |
| `204` | Usuario no alumno (no-op) |
| `400` | Metadata inválida (p. ej. > 2048 bytes tras sanitizar) |
| `422` | `event_type` fuera del allowlist |
| `403` | Falta consentimiento legal |

El cliente (`trackActivityEvent`) traga errores: fire-and-forget.

### Lectura admin (`/admin/analytics/*`)

Solo `require_admin_or_root`. Rango por defecto: últimos 30 días (`from` / `to`).

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/admin/analytics/summary` | KPIs + trends |
| `GET` | `/admin/analytics/activity-timeseries` | Alumnos activos / sesiones (`groupBy=day\|week\|month`) |
| `GET` | `/admin/analytics/engagement-timeseries` | Posts, comentarios, likes |
| `GET` | `/admin/analytics/organizations` | Actividad por organización seguida |
| `GET` | `/admin/analytics/students` | Tabla paginada + `activityScore` |
| `GET` | `/admin/analytics/at-risk-students` | Inactivos (`inactiveDays`, default 7) |

## Tipos permitidos y emisores

| `event_type` | Emisor actual | Metadata típica | ¿Cuenta como engagement? |
|--------------|---------------|-----------------|--------------------------|
| `app_opened` | `AnalyticsProvider` (una vez por montaje) | — | No |
| `page_view` | `AnalyticsProvider` al cambiar `pathname` | `{ page }` | No |
| `feed_viewed` | `AnalyticsProvider` si la ruta es `/app` o contiene `/inicio` | — | No |
| `post_created` | `PublicationWizard` | `{ post_id }` | Sí |
| `post_viewed` | `PostCard` (`onViewportEnter`) | `{ post_id }` | No |
| `post_liked` | `PostCard` | `{ post_id }` | Sí |
| `post_commented` | `PostCommentsSection` | `{ post_id }` | Sí |
| `event_viewed` | `EventDetailModal` | `{ event_id }` (string UUID) | No |
| `logout` | `AuthContext` + `POST /auth/logout` | — | No (cierra sesión) |
| `session_ended` | `beforeunload` | — | No (cierra sesión) |

`ENGAGEMENT_EVENT_TYPES` = `{ post_created, post_commented, post_liked }`. Esos son los únicos que alimentan gráficos de interacciones y el componente de *interactions* del activity score.

### Allowlist sin emisor en el cliente

Están aceptados por la API pero **hoy no se disparan** desde la SPA: `login`, `session_started`, `post_saved`, `profile_viewed`, `organization_viewed`, `notification_opened`, `search_performed`.

`session_started` no se escribe como evento: la fila de `user_sessions` se crea al recibir cualquier evento que no sea `logout` / `session_ended`.

El tipo TypeScript `AnalyticsEventType` **no incluye** `post_saved` (sí está en el backend). Para trackear guardados hay que añadir el union en `analytics.api.ts` y el `trackEvent` en el flujo de saved posts.

## `event_viewed` (detalle de evento compartido)

Al abrir el modal de detalle en `/app` → página de eventos (`EventsPage`), el alumno registra una vista del evento de la tabla compartida con Utopp Formulario.

```
EventCard / EventHeroCarousel
        │  onOpenDetail(event)
        ▼
EventDetailModal  useEffect([event])
        │  trackEventViewedThrottled(event.id)
        ▼
POST /analytics/events
  { "event_type": "event_viewed", "metadata": { "event_id": "<uuid>" } }
```

### Constraints

- **Throttle 1 hora por `event_id`**, en un `Map` en memoria del tab. Recargar la página resetea el throttle.
- `event.id` es **string** (UUID de Formulario), no el `post_id` numérico de Plataforma.
- Si `event` es `null` o `eventId` está vacío, no se envía nada.
- El perfil (`StudentProfileSelf`: inscritos / asistencias) **no** abre `EventDetailModal`; esas vistas no generan `event_viewed`.
- Rutas `/app/admin/*` no emiten analytics (el provider sale antes).

No confundir con `post_viewed`:

| | `post_viewed` | `event_viewed` |
|---|---|---|
| Trigger | Card entra al viewport | Se abre el modal de detalle |
| Id | `post_id: number` | `event_id: string` |
| Throttle | 5 s + delay de 2 s | 1 hora |
| Engagement admin | No | No |

## Metadata

Sanitizado en `tracking_service._sanitize_metadata`:

- Máximo **2048 bytes** JSON UTF-8 (también validado en el schema Pydantic).
- Claves prohibidas (se descartan): `password`, `token`, `secret`, `authorization`, `cookie`, `session_token`.
- Valores: `str | int | float | bool | None`, o listas de hasta 20 ítems.
- Nombres de clave recortados a 64 caracteres.
- Si existe `organization_id` numérico, se copia a `activity_events.organization_id` (y a la sesión abierta si aún no tiene org).

Ejemplo válido:

```json
{ "event_type": "event_viewed", "metadata": { "event_id": "a1b2c3d4-..." } }
```

## Sesiones

Idle: **30 minutos** (`SESSION_IDLE_MINUTES`).

- Evento distinto de `logout` / `session_ended` → `touch_or_create_session`.
- Dentro de la ventana de idle: actualiza `last_activity_at`.
- Fuera de idle: cierra la sesión abierta y abre otra.
- `logout` o `session_ended` → `end_user_sessions` (calcula `duration_seconds` hasta `last_activity_at`).

Device/browser se infieren del `User-Agent` (`mobile` / `tablet` / `desktop`; `chrome` / `safari` / `firefox`).

## Activity score (tabla de alumnos)

`calculate_activity_score` (0–100):

| Componente | Peso | Señal (últimos 7 días) |
|------------|------|------------------------|
| Frecuencia de sesiones | 40% | Nº de sesiones |
| Duración | 25% | Minutos totales |
| Interacciones | 20% | Solo `ENGAGEMENT_EVENT_TYPES` |
| Recencia | 15% | Días desde última actividad |

Labels: `Muy activo` (≥80), `Activo` (≥60), `Uso moderado` (≥40), `Bajo uso` (≥20), `Riesgo de abandono` (<20). Más de 30 días sin actividad → score `0` / `Inactivo`.

`event_viewed` **sí** cuenta como actividad (alumno activo / recencia / sesión) y **no** como interacción.

## Cómo añadir un tipo nuevo

1. Añadirlo a `ALLOWED_EVENT_TYPES` y a `AnalyticsEventType`.
2. Si debe entrar al gráfico de engagement, añadirlo a `ENGAGEMENT_EVENT_TYPES`.
3. Emitirlo con `trackEvent(...)` (o un helper con throttle si el trigger es ruidoso).
4. Cubrir el caso en `Utopp-Testing/test_analytics_tracking.py` si cambia el contrato.

No inventar tipos en el cliente: el schema rechaza con 422.

## Pitfalls

- **Doble `logout`:** el cliente llama `trackEvent("logout")` y el backend vuelve a persistir `logout` en `POST /auth/logout`. Esperable dos filas por cierre de sesión.
- **Throttle solo en el tab:** `event_viewed` / `post_viewed` no se deduplican en servidor.
- **Staff en 204, no 403:** un 204 en tracking no es error de auth.
- **Personalización Nivel 2** (`personalization_service.apply_personalization_signal`) existe para `post_liked` / `post_commented` / `post_saved`, pero **no está cableada** a `track_activity_event`. No asumir que un like ajusta el feed.
- Tests de contrato: `Utopp-Testing/test_analytics_tracking.py` y `Utopp-Testing/test_admin_analytics.py`. Score unitario: `Utopp-Testing/test_activity_score.py`.
