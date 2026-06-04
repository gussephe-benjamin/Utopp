<div align="center">
 
 _   _ _____ ___  ____  ____ 
| | | |_   _/ _ \|  _ \|  _ \
| | | | | || | | | |_) | |_) |
| |_| | | || |_| |  __/|  __/
 \___/  |_| \___/|_|   |_| 

**Plataforma de publicaciones académicas para tu comunidad universitaria**

[![Version](https://img.shields.io/badge/versión-v1.1.0-6366f1?style=flat-square)](https://github.com/gussephe-benjamin/Utopp/tags)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React+Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL_16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker_Compose-2496ED?style=flat-square&logo=docker)](https://docs.docker.com/compose/)
[![TypeScript](https://img.shields.io/badge/Lang-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## ¿Qué es Utopp?

**Utopp** es la red social académica que centraliza convocatorias, proyectos, eventos, anuncios y publicaciones de la comunidad en un único feed inteligente con filtros, prioridades y sistema de roles.

Cada usuario tiene un rol que determina qué puede publicar, qué nivel de visibilidad tienen sus publicaciones y si puede marcarlas con **prioridad máxima** para que aparezcan siempre al tope del feed.

---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Flujo de la aplicación](#flujo-de-la-aplicación)
- [Tecnologías](#tecnologías)
- [Características principales](#características-principales)
- [Requisitos previos](#requisitos-previos)
- [Variables de entorno](#variables-de-entorno)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Estructura del proyecto](#estructura-del-proyecto)
- [API — Endpoints principales](#api--endpoints-principales)
- [Roles y permisos](#roles-y-permisos)
- [Publicaciones prioritarias v1.1.0](#publicaciones-prioritarias-v110)

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                       Docker Compose                         │
│                                                              │
│  ┌────────────────┐    ┌─────────────────┐   ┌───────────┐  │
│  │   Frontend     │───▶│    Backend      │──▶│ PostgreSQL│  │
│  │  React + Vite  │    │    FastAPI      │   │  :5432    │  │
│  │    :5173       │    │    :8000        │   └───────────┘  │
│  └────────────────┘    └─────────────────┘                  │
│          │                     │                            │
│          └──────┐     ┌────────┘                            │
│                 ▼     ▼                                     │
│          ┌─────────────────┐                                │
│          │   Cloudinary    │  (almacenamiento de imágenes)  │
│          └─────────────────┘                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Flujo de la aplicación

```
                        ┌──────────────┐
                        │   Usuario    │
                        └──────┬───────┘
                               │
               ┌───────────────▼────────────────┐
               │      /login  ó  /register       │
               │  Formulario de credenciales      │
               │  o botón "Continuar con Google"  │
               └───────────────┬────────────────┘
                               │ JWT token
               ┌───────────────▼────────────────┐
               │       ¿Onboarding hecho?        │
               └──────┬──────────────────┬───────┘
                      │ No               │ Sí
            ┌─────────▼────────┐  ┌──────▼──────────────────┐
            │   /onboarding    │  │   /app  (Dashboard)      │
            │  Elegir intereses│  └──────┬──────────────────┘
            │  + foto de perfil│         │
            └─────────┬────────┘         │
                      └────────┬─────────┘
                               │
           ┌───────────────────▼────────────────────┐
           │               DASHBOARD                 │
           │                                         │
           │  ┌─────────┐  ┌──────────┐  ┌───────┐  │
           │  │  Feed   │  │  Perfil  │  │ Sched │  │
           │  └────┬────┘  └──────────┘  └───────┘  │
           └───────┼─────────────────────────────────┘
                   │
     ┌─────────────▼──────────────────────────┐
     │               FEED                      │
     │                                         │
     │  [+] Crear publicación (Wizard)         │
     │                                         │
     │  📌 Post prioritario (root)   ──┐       │
     │  📌 Post prioritario (admin)    ├─ Fijo │
     │  📌 Post prioritario (oficina) ─┘ arriba│
     │  ── Publicaciones generales ──          │
     │     Post evento                         │
     │     Post proyecto                       │
     │     Post convocatoria...                │
     │                                         │
     │  Filtros: tipo · tags · deadline        │
     │  Orden: urgencia | reciente             │
     └─────────────────────────────────────────┘
                   │
     ┌─────────────▼──────────────────────────┐
     │       WIZARD DE PUBLICACIÓN             │
     │                                         │
     │  1. Tipo de publicación                 │
     │  2. Subtipo                             │
     │  3. Links / botones CTA                 │
     │  4. Título, descripción, imágenes, tags │
     │  5. Encuadre de imágenes                │
     │  6. Vista previa → Publicar             │
     │                                         │
     │  📌 [Prioridad máxima]  ← admin/root/  │
     │                            oficina only │
     └─────────────────────────────────────────┘
```

---

## Tecnologías

### Backend

| Tecnología | Uso |
|---|---|
| **Python 3.11** | Lenguaje base |
| **FastAPI** | Framework REST con validación automática y Swagger |
| **SQLAlchemy 2** | ORM para modelos y queries |
| **PostgreSQL 16** | Base de datos relacional principal |
| **psycopg2** | Driver de conexión a PostgreSQL |
| **Pydantic v2** | Schemas de validación y DTOs |
| **python-jose** | Generación y verificación de JWT |
| **passlib (bcrypt)** | Hashing seguro de contraseñas |
| **google-auth** | OAuth2 con Google |
| **Uvicorn** | Servidor ASGI de producción |
| **Alembic** | Soporte de migraciones |
| **Docker** | Contenerización del servicio |

### Frontend

| Tecnología | Uso |
|---|---|
| **React 18** | Framework de UI declarativa |
| **TypeScript 5** | Tipado estático de extremo a extremo |
| **Vite 5** | Bundler ultrarrápido con HMR |
| **TailwindCSS 3** | Estilos utilitarios sin CSS custom |
| **React Router v6** | Enrutamiento SPA con rutas protegidas |
| **Axios** | Cliente HTTP con interceptor JWT automático |
| **Lucide React** | Librería de iconos SVG |
| **Cloudinary** | Upload directo de imágenes con transformaciones |

---

## Características principales

### Feed inteligente
- Paginación con botón "Cargar más"
- Filtrado por **tipo** (evento / proyecto / convocatoria / anuncio / simple)
- Filtrado por **tags** de interés (lógica OR)
- Filtrado por **estado de deadline** (vigente / vencida / sin fecha)
- Ordenamiento por **urgencia** (deadline más próximo arriba) o **más reciente**
- Publicaciones **prioritarias** siempre al tope con divisor visual entre secciones

### Publicaciones prioritarias *(v1.1.0)*
- Toggle **"Prioridad máxima"** en el wizard de creación y edición
- Visible únicamente para usuarios con rol `oficina`, `administrador` o `root`
- Jerarquía interna de prioridad: `root (3) > administrador (2) > oficina (1)`
- Las publicaciones pinned aparecen antes que cualquier filtro de fecha o tipo
- Card con borde dorado, banner "Publicación destacada" y etiqueta de rol

### Autenticación dual
- Login con **email + contraseña** (JWT firmado, expiración configurable)
- Login con **Google OAuth2** (un clic)
- Registro con validación de formato de email institucional

### Onboarding guiado
- Selección de intereses académicos personalizados
- Carga de foto de perfil
- Estado persistido: no se repite una vez completado

### Perfil de usuario
- Foto de perfil con upload a Cloudinary
- Vista de publicaciones propias
- Seguir / dejar de seguir a otros usuarios
- Lista de publicaciones guardadas

### Wizard de publicación (6 pasos)
- Selección de tipo de publicación y subtipo
- Configuración de botones de acción (links CTA con tipo e ícono)
- Carga y previsualización de imágenes con encuadre ajustable
- Tags, deadline opcional, título y descripción enriquecida
- Preview completa antes de publicar

### Participación en eventos
- Botón de inscripción / cancelación directamente desde la card del feed
- Estado de participación visible en tiempo real

### Gestión de roles (admin)
- Asignación y cambio de rol por usuario desde el panel de administración
- Bootstrap del primer admin mediante endpoint protegido por token

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+
- [Git](https://git-scm.com/)
- Cuenta en [Cloudinary](https://cloudinary.com/) (gratuita, para imágenes)
- Credenciales de Google OAuth2 en [Google Cloud Console](https://console.cloud.google.com/) *(opcional)*

---

## Variables de entorno

Crea un archivo **`.env`** en la raíz del proyecto:

```env
# ── Base de datos ──────────────────────────────────────
POSTGRES_USER=utopp_user
POSTGRES_PASSWORD=contraseña_segura
POSTGRES_DB=utopp_db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://utopp_user:contraseña_segura@db:5432/utopp_db

# ── Puertos ────────────────────────────────────────────
BACKEND_PORT=8000
FRONTEND_PORT=5173

# ── JWT ────────────────────────────────────────────────
SECRET_KEY=clave_secreta_aleatoria_muy_larga
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# ── Google OAuth2 ──────────────────────────────────────
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com

# ── Cloudinary ─────────────────────────────────────────
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset

# ── Setup / Bootstrap ──────────────────────────────────
ENABLE_ADMIN_BOOTSTRAP=true
BOOTSTRAP_ADMIN_TOKEN=token_secreto_para_primer_admin
```

---

## Instalación y ejecución

### Con Docker Compose (recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/gussephe-benjamin/Utopp.git
cd Utopp

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 3. Levantar todos los servicios
docker compose up --build
```

Una vez iniciado:

| Servicio | URL |
|---|---|
| **App web** | http://localhost:5173 |
| **API (Swagger UI)** | http://localhost:8000/docs |
| **API (ReDoc)** | http://localhost:8000/redoc |
| **Health check** | http://localhost:8000/health |

```bash
# Detener los contenedores
docker compose down

# Detener y eliminar la base de datos (⚠️ irreversible)
docker compose down -v

# Reconstruir solo un servicio
docker compose up --build backend
```

### Solo el backend (sin Docker)

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Solo el frontend (sin Docker)

```bash
cd Frontend/mi-app
npm install
npm run dev
```

### Primer administrador

Después del primer `docker compose up`, ejecuta:

```bash
curl -X POST http://localhost:8000/setup/bootstrap-admin \
  -H "X-Setup-Token: tu_BOOTSTRAP_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@utec.edu.pe",
    "password": "contraseña_segura",
    "full_name": "Admin Utopp"
  }'
```

Este endpoint solo funciona una vez (cuando no existe ningún administrador).

---

## Estructura del proyecto

```
Utopp/
├── docker-compose.yml               # Orquestación: db + backend + frontend
├── .env                             # Variables de entorno (no commitear)
│
├── Backend/
│   ├── Dockerfile                   # Python 3.11-slim + uvicorn
│   ├── requirements.txt             # Dependencias Python
│   └── app/
│       ├── main.py                  # FastAPI app + middlewares + routers
│       ├── core/                    # Configuración, seguridad, excepciones
│       ├── database/
│       │   ├── session.py           # Engine y SessionLocal
│       │   ├── base.py              # Base declarativa ORM
│       │   └── migrations.py        # Migraciones manuales idempotentes
│       ├── models/                  # Tablas SQLAlchemy
│       │   ├── user.py
│       │   ├── user_role.py
│       │   ├── role.py
│       │   ├── post.py              # + is_pinned, pin_priority  ← v1.1.0
│       │   ├── post_image.py
│       │   ├── post_link.py
│       │   ├── saved_post.py
│       │   ├── event_participant.py
│       │   ├── follow.py
│       │   └── user_profile_image.py
│       ├── schemas/                 # Pydantic DTOs (request / response)
│       │   ├── post.py              # + is_pinned en PostCreate/PostUpdate
│       │   ├── feed.py              # + is_pinned, pin_priority en FeedPostOut
│       │   └── ...
│       ├── routers/                 # Endpoints REST
│       │   ├── auth.py              # POST /auth/login, /auth/register
│       │   ├── googleAuth.py        # POST /google/login
│       │   ├── setup.py             # POST /setup/bootstrap-admin
│       │   ├── posts.py             # CRUD posts + publish
│       │   ├── feed.py              # GET /feed
│       │   ├── users.py             # Perfil, follows, guardados
│       │   ├── roles.py             # Asignación de roles
│       │   └── ...
│       └── services/                # Lógica de negocio pura
│           ├── post_service.py      # + get_user_pin_priority()  ← v1.1.0
│           ├── feed_service.py      # + ORDER BY is_pinned, pin_priority
│           ├── role_service.py
│           └── ...
│
└── Frontend/mi-app/
    └── src/
        ├── App.tsx                  # Rutas SPA (Login activo)  ← v1.1.0
        ├── auth/                    # AuthContext, ProtectedRoute, AppRoute
        ├── api/                     # Clientes Axios por dominio
        │   ├── axios.ts             # Instancia base + interceptor JWT
        │   ├── feed.api.ts
        │   ├── posts.api.ts         # + is_pinned en PostCreate/PostUpdate
        │   └── ...
        ├── components/
        │   ├── PublicationWizard.tsx # + toggle Prioridad máxima  ← v1.1.0
        │   ├── EditPostWizard.tsx    # + toggle Prioridad máxima  ← v1.1.0
        │   └── ...
        ├── pages/
        │   ├── Feed.tsx             # + banner pin + divisor      ← v1.1.0
        │   ├── Profile.tsx
        │   ├── Dashboard.tsx
        │   └── auth/
        │       ├── Login.tsx        # Formulario de credenciales  ← v1.1.0
        │       └── RegisterOG.tsx
        ├── hooks/
        │   └── useRole.ts           # Detecta rol del usuario autenticado
        └── types/
            └── post.types.ts        # + is_pinned, pin_priority en FeedPostOut
```

---

## API — Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Login con email + contraseña | ❌ |
| `POST` | `/auth/register` | Registro de nuevo usuario | ❌ |
| `POST` | `/google/login` | Autenticación con Google OAuth2 | ❌ |
| `POST` | `/setup/bootstrap-admin` | Crear primer admin (token) | Token |
| `GET` | `/feed` | Feed paginado con filtros | ✅ |
| `GET` | `/feed?type=evento` | Feed filtrado por tipo | ✅ |
| `GET` | `/feed?tags=ia&tags=datos` | Feed filtrado por tags | ✅ |
| `POST` | `/posts/` | Crear post (borrador) | ✅ |
| `PATCH` | `/posts/{id}` | Actualizar post | ✅ owner/admin |
| `POST` | `/posts/{id}/publish` | Publicar borrador | ✅ owner |
| `DELETE` | `/posts/{id}` | Archivar post | ✅ owner/admin |
| `POST` | `/posts/{id}/images` | Agregar imagen | ✅ owner |
| `POST` | `/posts/{id}/links` | Agregar link CTA | ✅ owner |
| `GET` | `/users/me` | Perfil del usuario autenticado | ✅ |
| `GET` | `/users/{id}` | Perfil público de usuario | ✅ |
| `POST` | `/users/{id}/roles/{role}` | Asignar rol a usuario | ✅ admin |
| `POST` | `/saved-posts/{id}` | Guardar / quitar publicación | ✅ |
| `POST` | `/events/{id}/join` | Inscribirse a evento | ✅ |
| `GET` | `/health` | Estado del servicio | ❌ |

Documentación interactiva completa disponible en **http://localhost:8000/docs**

---

## Roles y permisos

| Rol | Publicar | Prioridad máxima | Gestionar usuarios |
|-----|:--------:|:----------------:|:------------------:|
| `estudiante` | ✅ | ❌ | ❌ |
| `organización estudiantil` | ✅ | ❌ | ❌ |
| `oficina` | ✅ | ✅ prioridad 1 | ❌ |
| `administrador` | ✅ | ✅ prioridad 2 | ✅ parcial |
| `root` | ✅ | ✅ prioridad 3 | ✅ total |

---

## Publicaciones prioritarias v1.1.0

Los usuarios con rol `oficina`, `administrador` o `root` ven el botón **"Prioridad máxima"** en el wizard de creación y en el editor. Al activarlo:

1. El backend calcula `pin_priority` según el rol del autor
2. El feed ordena: `is_pinned DESC → pin_priority DESC → urgencia/fecha`
3. Cada card pinned muestra un banner dorado con etiqueta de rol

```
Feed resultante:
┌─────────────────────────────────────────┐
│ 📌 Publicación destacada   [Root]        │  pin_priority = 3
│ 📌 Publicación destacada   [Admin]      │  pin_priority = 2
│ 📌 Publicación destacada   [Oficina]     │  pin_priority = 1
├──── — Publicaciones generales — ────────┤  ← Divisor automático
│  Evento: Hackathon Utopp                │
│  Convocatoria: Beca investigación       │
│  Proyecto: App de movilidad             │
│  ...                                    │
└─────────────────────────────────────────┘
```

Al desactivar el pin, la publicación regresa al flujo normal del feed sin necesidad de recrearla.

---

<div align="center">

Desarrollado para conectar la comunidad académica · versión **v1.1.0**

</div>



