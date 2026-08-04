# Despliegue OAuth en Render

Guía para que Google OAuth funcione con frontend y backend en dos servicios de [Render](https://render.com).

## 1. Variables del backend (Render → tu servicio API → Environment)

| Variable | Valor producción |
|----------|------------------|
| `GOOGLE_CLIENT_ID` | Client ID de Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Client secret |
| `GOOGLE_REDIRECT_URI` | `https://utopp.onrender.com/auth/google/callback` |
| `FRONTEND_URL` | `https://www.utopp.app` |
| `UF_FRONTEND_URL` | `https://www.formulario.utopp.app` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `SECRET_KEY` | Valor aleatorio fuerte (distinto a local) |

Plantilla completa: [`deploy/render.env.example`](../deploy/render.env.example)

### Por qué `COOKIE_SAMESITE=none`

Frontend y backend en Render tienen hosts distintos (`*.onrender.com`). Con `SameSite=Lax` el navegador **no envía** cookies en peticiones cross-origin. La app usa sesión HttpOnly (`withCredentials: true`), así que en producción cross-origin necesitas `none` + `secure`.

## 2. Variables del frontend (Render → tu servicio frontend → Environment)

Solo `VITE_*` (no secretos de Google ni Cloudinary API secret):

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `https://www.api.utopp.app` |
| `VITE_UF_FRONTEND_URL` | `https://www.formulario.utopp.app` |
| `VITE_CLOUDINARY_CLOUD_NAME` | tu cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | tu unsigned preset |

**No uses** `https://api.utopp.app` (sin `www`): Cloudflare responde **307** hacia `www.api` y el navegador bloquea el `POST /auth/session/exchange` (CORS) → pantalla blanca en `/auth/callback`.

**Rebuild obligatorio:** Vite incluye `VITE_*` en el bundle al compilar. Después de cambiar estas variables, lanza un nuevo deploy (idealmente con *Clear build cache*).

**SPA rewrite** en el Static Site: `/*` → `/index.html` (Action: **Rewrite**), para que `/auth/callback` no dé Not Found.

## 3. Google Cloud Console

1. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edita tu **OAuth 2.0 Client ID** (Web application)
3. **Authorized redirect URIs** — añade **las dos**:
   - `http://localhost:8000/auth/google/callback` (desarrollo)
   - `https://utopp.onrender.com/auth/google/callback` (producción)
4. **Authorized JavaScript origins** (opcional):
   - `https://www.utopp.app`

El valor de `GOOGLE_REDIRECT_URI` en Render debe coincidir **exactamente** con una URI autorizada.

El backend usa **PKCE (S256)** en el flujo OAuth: al iniciar sesión se envían `code_challenge` y en el callback `code_verifier`. No requiere configuración extra en Google Cloud Console.

## 4. CORS

El backend añade automáticamente `FRONTEND_URL` y `ALLOWED_ORIGINS` (lista separada por comas) a los orígenes CORS permitidos. Orígenes conocidos (`utopp.app`, `formulario.utopp.app`, localhost y el frontend antiguo de Render) ya están incluidos.

## 5. Session handoff (login de usuarios existentes)

En producción, frontend y backend están en dominios distintos. Aunque la cookie `utopp_session` se establece en el callback de Google, el navegador puede no enviarla en peticiones XHR cross-origin (`GET /auth/me`), lo que provocaba un bucle `/login` → Google → `/login`.

**Solución:** tras OAuth, el backend redirige a:

`https://www.utopp.app/auth/callback?session_token=...`

El frontend (`AuthCallback.tsx`) canjea el token con:

`POST https://utopp.onrender.com/auth/session/exchange`

Ese endpoint valida un JWT de un solo uso (2 min), setea `utopp_session` en la respuesta XHR y devuelve el usuario autenticado. Luego la app redirige según estado (`/app/terms`, `/onboarding`, `/app/inicio`).

El registro de usuarios nuevos sigue usando `pending_token` en la URL (`/login?google_register=1&pending_token=...`).

## 6. Verificación

1. `curl https://utopp.onrender.com/health/` → respuesta OK de la API
2. Abre la app en `https://www.utopp.app/login`
3. Clic en **Continuar con Google** → la URL debe ser `https://utopp.onrender.com/auth/google/login` (no `localhost`)
4. Tras Google → `https://utopp.onrender.com/auth/google/callback?...`
5. Redirect a `https://www.utopp.app/auth/callback?session_token=...`
6. Pantalla "Iniciando sesión..." → exchange → feed o términos sin volver a login

### Comprobar exchange manualmente

```bash
# Tras un login Google, copia session_token de la URL del frontend y:
curl -s -X POST https://utopp.onrender.com/auth/session/exchange \
  -H "Content-Type: application/json" \
  -d '{"session_token":"TOKEN_AQUI"}' \
  -c cookies.txt -b cookies.txt
```

Respuesta esperada: `{"authenticated": true, "user": {...}}` y header `Set-Cookie: utopp_session=...`.

### Error `localhost refused to connect` en el callback

Google está redirigiendo a `localhost` porque:

- `GOOGLE_REDIRECT_URI` en el backend de Render sigue en `localhost`, **o**
- El frontend desplegado aún usa `VITE_API_URL=http://localhost:8000` (rebuild pendiente)

Revisa logs del backend al arrancar: se imprime `redirect_uri` y `cors_origins` para depuración.

### Diagnóstico (jun 2026)

Al probar `GET https://utopp.onrender.com/auth/google/login`, el backend en Render aún enviaba a Google:

`redirect_uri=http://localhost:8000/auth/google/callback`

El backend en Render fuerza automáticamente `COOKIE_SAMESITE=none` y `COOKIE_SECURE=true` cuando detecta `RENDER_EXTERNAL_URL` y hosts distintos entre frontend y backend (incluso si el env tiene `strict` o `lax`).

**Acción requerida en el panel de Render (servicio backend):** verificar `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`, redeploy backend. En el frontend, fijar `VITE_API_URL=https://utopp.onrender.com` y rebuild.

## Desarrollo local vs producción

| | Local (Docker) | Render |
|---|----------------|--------|
| `GOOGLE_REDIRECT_URI` | `http://localhost:8000/auth/google/callback` | `https://www.api.utopp.app/auth/google/callback` |
| `FRONTEND_URL` | `http://localhost:5173` | `https://www.utopp.app` |
| `UF_FRONTEND_URL` | `http://localhost:5174` | `https://www.formulario.utopp.app` |
| `VITE_API_URL` | `http://localhost:8000` | `https://www.api.utopp.app` |
| `VITE_UF_FRONTEND_URL` | `http://localhost:5174` | `https://www.formulario.utopp.app` |
| `COOKIE_SECURE` | `false` | `true` |
| `COOKIE_SAMESITE` | `lax` | `none` |
