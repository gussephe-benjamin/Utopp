# Integración Utopp Plataforma ↔ Utopp Formulario

Los dos productos comparten **una instancia de PostgreSQL** y un flujo de **SSO**. Los eventos ya no son posts de tipo `event`: viven en `formulario.events` (DDL del repo `utopp-formulario`). Este documento cubre arquitectura, APIs, SSO y fallos habituales.

Guía OAuth de Render (cookies, callback, exchange): [deploy/RENDER_OAUTH.md](deploy/RENDER_OAUTH.md).

---

## Intención

| Producto | Rol |
|----------|-----|
| **Plataforma** (este repo) | Feed, publicaciones, perfil, listado público de eventos, creación básica de eventos |
| **Formulario** (`utopp-formulario`) | Inscripción, boletos, check-in, campos personalizados del formulario, dashboard del organizador |

Plataforma **lista eventos de todos los creadores**. Formulario, en su dashboard, lista solo los del organizador autenticado.

---

## Arquitectura

```
┌─────────────────────────┐     SSO (?sso_token=)     ┌──────────────────────────┐
│  Utopp Plataforma       │ ─────────────────────────▶│  Utopp Formulario        │
│  www.utopp.app          │                           │  www.forms.utopp.app     │
│  GET/POST /events       │                           │  /e/{id}  /ticket/{id}   │
│  GET /users/me/events   │                           │  /dashboard              │
└───────────┬─────────────┘                           └────────────┬─────────────┘
            │  mismo Postgres, dos schemas                         │
            ▼                                                      ▼
     schema public                          schema formulario
     (dueño: utopp_plataforma)              (dueño: utopp-formulario)
            │                                                      │
            └──────── lectura / INSERT acotado ────────────────────┘
```

### Permisos de `utopp_plataforma` sobre `formulario`

Los crea la migración Alembic `0003` del repo Formulario. Sobre ese schema Plataforma solo tiene:

- `USAGE` del schema
- `SELECT` + `INSERT` en `events` y `users`
- `SELECT` en `attendees` (y lectura de `tickets` para check-in / boleto)

Cualquier `UPDATE`/`DELETE` o escritura en `ticket_form_fields` falla a propósito. El modelo ORM usa una `SharedBase` distinta para que `Base.metadata.create_all()` de Plataforma **nunca** cree ni altere tablas de otro schema.

### Correspondencia de usuarios

La clave entre productos es el **email** (case-insensitive):

1. Al crear un evento desde Plataforma, `resolve_formulario_user` busca o inserta una fila en `formulario.users` con `password_hash=None` (usuario SSO).
2. `formulario.events.creator_id` es FK a esa fila.
3. El perfil (`GET /users/me/events`) hace JOIN on-read contra `formulario.attendees` por email: un guest que luego se registra en Utopp con el mismo correo aparece **sin backfill**.

---

## Superficie pública

### Eventos compartidos

| Método | Ruta | Auth | Comportamiento |
|--------|------|------|----------------|
| `GET` | `/events` | ❌ | Todos los eventos **publicados** (`is_draft = false`), de todos los creadores. Paginado. |
| `GET` | `/events/{event_id}` | ❌ | Detalle. 404 si no existe o es borrador. |
| `POST` | `/events` | ✅ + términos | Crea en `formulario.events` con `is_draft=false` y `visible_on_plataforma=true`. |

Query params de listado (`page`, `size` ≤ 100):

| Param | Efecto |
|-------|--------|
| `upcoming_only=true` | `date_time >= now()` |
| `search` | `ILIKE` en título y lugar |
| `category` | igualdad exacta |

Orden: `date_time DESC`. El campo `visible_on_plataforma` se **devuelve** pero **ya no filtra** el listado (filtro suspendido).

`registration_url` se construye como `{UF_FRONTEND_URL}/e/{event_id}`. `registered_count` cuenta filas en `formulario.attendees`; si no hay permiso de lectura, queda en `0`.

Cuerpo de creación (campos relevantes):

```json
{
  "title": "Hackathon Utopp",
  "date_time": "2026-09-01T18:00:00-05:00",
  "location": "UTEC",
  "capacity": 80,
  "category": "tech",
  "theme": "violet",
  "ticket_style": "clasico",
  "allow_only_utec_emails": true
}
```

`ticket_style`: `clasico` | `stub` | `pase` (default `clasico`). El wizard de Plataforma **no** replica campos personalizados de inscripción: el evento nace con el formulario estándar (nombre + email). Banner ≤ 3 MB (validado en el cliente).

### Eventos del perfil (asistente)

| Método | Ruta | Auth |
|--------|------|------|
| `GET` | `/users/me/events` | ✅ + términos |

Query: `page`, `size`, `status=registered|attended`.

Reglas de visibilidad (SQL + dedupe):

- Excluye borradores.
- **Inscrito sin check-in** desaparece cuando `date_time` ya pasó.
- **Check-in** permanece siempre (evidencia / logro).
- Una tarjeta por `event_id`: si hay inscripciones o boletos duplicados, gana la fila con check-in.
- Si el schema `formulario` no existe o el dialecto no es PostgreSQL, responde `[]` (no 500).

`ticket_url` = `{UF_FRONTEND_URL}/ticket/{ticket_id}`. El perfil (`StudentProfileSelf`) abre ese enlace tras `publicFormularioHref` (reescribe localhost en producción).

### Feed y participantes (legado cruzado)

Los feeds de publicaciones (`StudentFeedPage`, `OrganizationFeedPage`) piden `exclude_type=event`. Los posts históricos de tipo `event` no se borran; el script `app.scripts.migrate_event_posts_to_shared_events` los copia a `formulario.events` (idempotente vía `utopp_post_id`).

Si un evento compartido tiene `utopp_post_id`, el feed puede adjuntar `registration_url` y `list_public_participants` une inscritos de `public.event_participants` con `formulario.attendees` (dedupe por email; el email no se expone).

---

## Flujos

### Crear evento (UI)

1. Usuario autenticado abre `/app/eventos` → `CreateEventWizard`.
2. `POST /events` inserta en `formulario.events` y, si hace falta, en `formulario.users`.
3. El evento aparece en la sección Eventos de Plataforma **y** en el dashboard de Formulario del organizador (mismo `creator_id`).
4. La inscripción pública ocurre en Formulario: `/e/{id}`.

La card «Evento con boletos» del wizard de **publicaciones** está **suspendida**. No hay segundo punto de entrada en la barra superior.

### SSO hacia Formulario

La sesión de Plataforma vive en cookie HttpOnly. El token SSO **no** se guarda en el cliente:

1. Clic → `POST /auth/refresh` (cookie) → `access_token`.
2. Redirect a `{UF}/...?sso_token={token}`.
3. `openUtoppFormularioSso()` abre la pestaña **antes** del `await` (sin `noopener`, o `window.open` devuelve `null`) y navega a `{UF}/dashboard`.

Retorno post-login desde Formulario:

1. Formulario manda a `/login?redirect={url_formulario}`.
2. Solo hosts permitidos: `localhost`, `127.0.0.1`, `www.forms.utopp.app`, `forms.utopp.app`, `utopp-formulario.onrender.com`, y los apex legacy `formulario.utopp.app`.
3. La URL se guarda en `sessionStorage` (`utopp_formulario_return_url`) por si el flujo Google pierde el query param.
4. Tras sesión válida, `redirectToUtoppFormularioSso` vuelve con `sso_token`.

`SECRET_KEY` / `JWT_SECRET_KEY` deben **coincidir** con Formulario; si no, el `sso_token` no valida.

### Reescritura de URLs en producción

`canonicalizeUtoppFormularioUrl` / `publicFormularioHref`:

- `forms.utopp.app` y `*.formulario.utopp.app` → `www.forms.utopp.app` (el apex hace 301 y puede **tirar** `?sso_token=`).
- Si el usuario está en `utopp.app` / `www.utopp.app` (o hosts Render legacy) y la API aún emite `http://localhost:5174/...`, se reescribe a `https://www.forms.utopp.app`.

---

## Setup local

1. `docker network create utopp_default` (una vez). Este repo es dueño del contenedor Postgres (`hostname: db`).
2. Copiar `.env.example` → `.env`. `DATABASE_URL` usa el rol `utopp_plataforma`, **no** el superusuario.
3. Levantar Formulario al menos una vez para aplicar Alembic `0003` (roles + schema `formulario`). El orden de `compose up` es indiferente una vez existe el network.
4. Alinear JWT:

```env
SECRET_KEY=la_misma_clave_en_ambos_repos
JWT_SECRET_KEY=la_misma_clave_en_ambos_repos
UF_FRONTEND_URL=http://localhost:5174
VITE_UF_FRONTEND_URL=http://localhost:5174
```

5. `docker compose up --build`

| Servicio | URL |
|----------|-----|
| Plataforma | http://localhost:5173 |
| Formulario | http://localhost:5174 |
| API | http://localhost:8000/docs |

Migración de posts históricos (opcional, idempotente):

```bash
docker compose exec backend python -m app.scripts.migrate_event_posts_to_shared_events --dry-run
docker compose exec backend python -m app.scripts.migrate_event_posts_to_shared_events
```

---

## Producción (Render)

| Variable | Valor canónico |
|----------|----------------|
| `UF_FRONTEND_URL` (backend) | `https://www.forms.utopp.app` |
| `VITE_UF_FRONTEND_URL` (frontend) | `https://www.forms.utopp.app` |
| `ALLOWED_ORIGINS` | incluir `https://www.forms.utopp.app` y `https://forms.utopp.app` |

`VITE_*` se embebe en el build: tras cambiar, **Clear build cache**. Plantilla: [`deploy/render.env.example`](../deploy/render.env.example).

---

## Pitfalls

| Síntoma | Causa habitual | Qué revisar |
|---------|----------------|-------------|
| Clic «Inscribirse» / boleto va a `:5174` en utopp.app | `UF_FRONTEND_URL` del backend sigue en localhost | Env del API + redeploy. El frontend reescribe en hosts de producción, pero el API debe emitir la URL canónica. |
| SSO vuelve a login o token inválido | JWT distinto entre repos, o redirect al apex `forms.utopp.app` | Misma `SECRET_KEY`. Siempre `www.forms.utopp.app`. |
| Formulario ignora el return post-login | `redirect` no está en la allowlist | Host real: `www.forms.utopp.app` (no `formulario.utopp.app`). |
| `/events` o perfil vacíos sin error | Schema `formulario` ausente o rol sin `SELECT` | Alembic 0003 de Formulario; `DATABASE_URL` con `utopp_plataforma`. |
| Popup bloqueado al abrir Formulario | El navegador bloqueó la pestaña | `openUtoppFormularioSso` abre la pestaña de forma síncrona; hay que permitir popups. |
| Evento creado en Plataforma sin inscripción custom | Diseño | Campos de formulario solo se editan en Formulario. |
| Dos inscripciones, una sola card en el perfil | Deduplicación por `event_id` | Intencional; gana la fila con check-in. |
| Cambio de columna en `SharedEvent` rompe el otro producto | DDL lo manda Formulario | Migrar primero en `utopp-formulario`. |

Tests unitarios del listado de perfil (sin Postgres vivo): `Utopp-Testing/test_user_events.py`.
