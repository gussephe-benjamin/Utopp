# Catálogo de eventos compartidos (`formulario.events`)

Describe cómo Utopp Plataforma lista, muestra y crea eventos que viven en la
tabla de **Utopp Formulario**. No hay réplica: ambos productos leen e insertan
en el mismo schema `formulario`.

El perfil propio (`GET /users/me/events`) es otro contrato: JOIN por email
contra inscritos. Ver [user-profile-events.md](user-profile-events.md).

## Intent

- Una sola fuente de eventos para la página **Eventos**, el landing de
  Formulario y (si hay `utopp_post_id`) el CTA de inscripción en el feed.
- En Plataforma el listado es **de todos los creadores**. En el dashboard de
  Formulario, el organizador solo ve los suyos.
- Inscribirse **no** ocurre en esta API: el clic abre `{UF_FRONTEND_URL}/e/{id}`.

## Arquitectura

```
CreateEventWizard / Formulario dashboard
        │
        ▼
POST /events  (Plataforma)     o insert en Formulario
        │
        ├─ resolve_formulario_user(email) → formulario.users
        └─ INSERT formulario.events
              is_draft = false
              visible_on_plataforma = true
        │
        ▼
GET /events  (público, PageResponse)
        │  WHERE is_draft IS FALSE
        │  (visible_on_plataforma NO filtra)
        ▼
EventsPage / EventHeroCarousel / EventDetailModal
        │  Registrarme → registration_url
        ▼
Utopp Formulario  /e/{id}
        │
        └─ attendees + tickets   →   GET /users/me/events (perfil)
```

Fuente: `app/services/shared_event_service.py`. El DDL lo manda el repo
`utopp-formulario` (Alembic). El modelo `SharedEvent` usa una `Base` propia
para que `create_all()` de Plataforma **nunca** cree ni altere ese schema.

Permisos de Plataforma sobre `formulario` (rol `utopp_plataforma`):

| Objeto | Permitido |
|--------|-----------|
| `events`, `users` | `SELECT` + `INSERT` |
| `attendees` | `SELECT` (conteo de inscritos) |
| `tickets` / `ticket_form_fields` | No escribe |

## Contrato público

### `GET /events`

Auth: **no requerida**. Respuesta: `PageResponse[SharedEventOut]`.

| Query | Default | Notas |
|-------|---------|-------|
| `page` | `1` | `ge=1` |
| `size` | `20` | `1…100`. La SPA pide `12`. |
| `upcoming_only` | `false` | Si `true`, `date_time >= NOW()` |
| `search` | omitido | `ILIKE` en `title` **o** `location` |
| `category` | omitido | Igualdad exacta (`conferencias`, `deporte`, …) |

Orden: `date_time DESC` (pasados incluidos salvo `upcoming_only`).

La página Eventos **no** envía `upcoming_only` ni `search`. El countdown
«Finalizado» / «Inscripciones cerradas» es solo UI (`getEventCountdown`).

### `GET /events/{id}`

Auth: no requerida. `404` si no existe **o** `is_draft = true`.

### `POST /events`

Auth: sesión + términos (`require_terms_accepted`). **Sin chequeo de rol**:
cualquier usuario autenticado con consentimiento puede crear.

Nace publicado y visible:

- `is_draft = false`
- `visible_on_plataforma = true`
- `ticket_style` default `clasico` (el wizard de Plataforma no lo envía)
- `utopp_post_id` queda `null` (no crea publicación en el feed)

```json
{
  "title": "Hackathon Utopp",
  "date_time": "2026-08-20T18:00:00Z",
  "location": "UTEC",
  "category": "competencias",
  "theme": "violet",
  "allow_only_utec_emails": false
}
```

`201` + el mismo `SharedEventOut` que el GET.

### Qué no existe

| Ruta | Estado |
|------|--------|
| `POST /events/{id}/join` | **No hay.** Inscripción = Formulario `/e/{id}` |
| `PATCH` / `DELETE /events/{id}` | No en Plataforma. Editar/borrar es de Formulario |
| Campos custom del formulario | Solo el dashboard de Formulario (`ticket_form_fields`) |

La participación legacy `POST /posts/{id}/participate` sigue existiendo para
**posts** históricos de tipo `event`, no para filas de `formulario.events`.

## Visibilidad

Único filtro de catálogo / detalle:

```
is_draft IS FALSE
```

| Caso | ¿Sale en `GET /events`? |
|------|-------------------------|
| Publicado, cualquier creador, pasado o futuro | Sí |
| `is_draft = true` (solo dashboard Formulario) | No (detalle → 404) |
| `visible_on_plataforma = false` | **Sí** (filtro suspendido) |
| Schema `formulario` ausente | El listado revienta al consultar la tabla; el conteo de inscritos sí degrada a `0` |

`visible_on_plataforma` se **devuelve** en el JSON y se fuerza a `true` al
crear desde Plataforma. No se usa en `WHERE`. No asumir que desmarcarlo en
Formulario oculta el evento aquí.

## Organizador espejo

`formulario.events.creator_id` es FK a `formulario.users`. Antes de insertar,
`resolve_formulario_user` busca por email (case-insensitive) y, si no hay
fila, crea una con `password_hash = None` (usuario SSO para Formulario).

Sin email en la cuenta Utopp: `400`.

`creator.utopp_user_id` se resuelve on-read cruzando `formulario.users.email`
con `public.users.email`. No es una FK persistida.

## Inscripción y URLs

`registration_url` = `{UF_FRONTEND_URL}/e/{event_id}`.

El modal (`EventDetailModal`) abre esa URL en pestaña nueva. Si
`date_time` ya pasó, el botón se sustituye por «Inscripciones cerradas»
(solo cliente; Formulario puede tener su propia regla).

El backend **no** reescribe `UF_FRONTEND_URL` en Render. Si queda en
`:5174`, `canonicalizeUtoppFormularioUrl` corrige el href cuando la SPA
corre en `utopp.app`. Ver [docs/deploy/RENDER_OAUTH.md](../../docs/deploy/RENDER_OAUTH.md).

`registered_count` es `COUNT(*)` de `formulario.attendees`. Si no hay
permiso / schema (`ProgrammingError`), el servicio hace rollback y
devuelve `0` por evento (el listado en sí sigue).

## Relación con el feed

Los eventos **ya no se crean como `posts`**:

- `PostCreate` rechaza `post_type=event` (`ValueError` → 422).
- El wizard de publicación no muestra la card «Evento con boletos».
- El feed de publicaciones pide `exclude_type=event`.

Los posts históricos de tipo evento siguen en `public.posts`. El script
idempotente `app.scripts.migrate_event_posts_to_shared_events` copia los
publicados con fecha a `formulario.events` y setea `utopp_post_id`
(índice único). No borra el post.

Si un post tiene `utopp_post_id` en `formulario.events`, `GET /feed` adjunta
`registration_url`. Esa query **no** filtra `is_draft`: un borrador
enlazado a un post histórico podría mostrar CTA.

El showcase del login (`AuthLatestEvents`) sigue leyendo **posts** de tipo
evento del feed, no `GET /events`.

## Wizard de creación (SPA)

`CreateEventWizard` en `/app` → Eventos. Campos alineados al paso 1 de
Formulario; **no** replica el paso 2 (campos custom).

| Campo | Constraint |
|-------|------------|
| Banner | Imagen, máx **3 MB**, Cloudinary |
| `short_description` | máx 140 (solo UI) |
| `category` | Catálogo compartido: `conferencias`, `congresos`, `arte`, `emprendimiento`, `competencias`, `voluntariado`, `deporte`, `visita-academica`, `empleo` |
| `theme` | `violet`, `sunset`, `ocean`, `emerald`, `magenta`, `midnight` |
| `allow_only_utec_emails` | Lo aplica Formulario al inscribir, no Plataforma |

Tras crear, dispara `eventCreated` y el listado hace refresh.

## SSO de vuelta a Formulario

No forma parte de `GET /events`. Si Formulario manda a
`/login?redirect=<url-uf>`:

1. Host allowlist (`localhost`, `utopp-formulario.onrender.com`,
   `www.forms.utopp.app` y legacy).
2. Se guarda en `sessionStorage` (sobrevive el round-trip de Google).
3. Tras login, si hay términos + onboarding: `POST /auth/refresh` y
   redirect a `{url}?sso_token=...`.
4. Si faltan términos u onboarding, primero el flujo de Plataforma.

`openUtoppFormularioSso()` (dashboard `/dashboard` en pestaña nueva) quedó
sin callers al suspender la card del wizard.

## Pitfalls

- **`visible_on_plataforma` no oculta.** El filtro se suspendió a propósito
  (`4d76312`). Cambiar el flag en Formulario no saca el evento del catálogo.
- **Borradores = invisibles.** Un organizador que guarda draft en Formulario
  no aparece aquí ni por id (404).
- **No hay join en esta API.** Un `POST /events/{id}/join` 404 no es un
  bug de routing: la inscripción es el landing de Formulario.
- **Cualquier alumno puede crear.** No hay gate de rol en `POST /events`.
- **Pasados se listan.** La SPA no usa `upcoming_only`; el grid mezcla
  vigentes y finalizados (`date_time DESC`).
- **Conteo frágil.** Sin `SELECT` en `attendees`, `registered_count` es 0
  y no se distingue de «nadie inscrito».
- **localhost en CTA.** Fijar `UF_FRONTEND_URL` / `VITE_UF_FRONTEND_URL` en
  Render. El rewrite del cliente no ayuda a Postman ni a otros clientes.
- **Categorías legacy.** Posts migrados pueden traer `conferencia` (singular);
  `getEventType` aliasa a `conferencias`. El query `category=` es exacto y
  no aplica esos alias.
- No hay tests de contrato de `GET/POST /events` en `Utopp-Testing` (sí los
  hay de perfil: `test_user_events.py`).
