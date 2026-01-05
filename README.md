---

# 📘 **FastAPI Async + PostgreSQL + Docker + pgAdmin**

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Async-green)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

# 📚 **Descripción del Proyecto**

Este proyecto implementa una API construida con **FastAPI** utilizando un stack **100% asíncrono** (SQLAlchemy + asyncpg), acompañada de una base de datos **PostgreSQL** y un panel visual **pgAdmin** para administración.
Todo corre dentro de un entorno aislado gracias a **Docker Compose**, permitiendo reproducibilidad, portabilidad y despliegue rápido.

---

# 🏗 **Arquitectura del Sistema**

```
                ┌──────────────────────────┐
                │        FastAPI API        │
                │  (Uvicorn ASGI Server)    │
                └─────────────┬────────────┘
                              │
                              │  DATABASE_URL
                              ▼
                ┌──────────────────────────┐
                │        PostgreSQL         │
                │ (Persistencia en Volumen) │
                └─────────────┬────────────┘
                              │
                              │  Internal Docker Network
                              ▼
                ┌──────────────────────────┐
                │          pgAdmin          │
                │   (Panel de Administración)│
                └──────────────────────────┘
```

---

# 📁 **Estructura del Proyecto**

```
project/
 ├── main.py
 ├── db.py
 ├── models.py
 ├── schemas.py
 ├── requirements.txt
 ├── Dockerfile
 └── docker-compose.yml
```

---

# 🐳 **Dockerfile (API FastAPI async)**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

# 🐳 **docker-compose.yml (API + DB + pgAdmin)**

```yaml
version: "3.9"

services:
  api:
    build: .
    container_name: fastapi_async_app
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16
    container_name: postgres_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4
    container_name: pgadmin
    restart: always
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - db

volumes:
  pgdata:
```

---

# 🚀 **Comandos esenciales**

## 1️⃣ Levantar todo el stack (API + DB + pgAdmin)

```bash
docker compose up --build
```

Modo background:

```bash
docker compose up -d
```

---

## 2️⃣ Detener los contenedores

```bash
docker compose down
```

---

## 3️⃣ Detener y eliminar volúmenes (⚠️ elimina la base de datos)

```bash
docker compose down -v
```

---

## 4️⃣ Reconstruir solo la API (rápido)

```bash
docker compose up -d --build api
```

---

## 5️⃣ Entrar al contenedor de PostgreSQL

```bash
docker exec -it postgres_db bash
```

Entrar a PostgreSQL:

```bash
psql -U postgres -d mydb
```

---

# 🌐 **Accesos**

| Servicio            | URL                                                      | Credenciales                                      |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| **FastAPI Docs**    | [http://localhost:8000/docs](http://localhost:8000/docs) | —                                                 |
| **pgAdmin**         | [http://localhost:5050](http://localhost:5050)           | [admin@admin.com](mailto:admin@admin.com) / admin |
| **PostgreSQL**      | Host interno: `db`                                       | postgres / postgres                               |
| **PostgreSQL (PC)** | localhost:5432                                           | postgres / postgres                               |

---

# 🛠 **Conectar pgAdmin al PostgreSQL del Compose**

1. pgAdmin → **Servers** → *Register* → *Server*
2. **GENERAL**

   * Name: `Docker-Postgres`
3. **CONNECTION**

   * Hostname: `db`
   * Username: `postgres`
   * Password: `postgres`
   * Database: `mydb`
   * Port: `5432`

---

# 🧪 **Prueba de funcionamiento**

Prueba un POST para crear un usuario:

```json
POST /users
{
  "name": "Benjamin",
  "email": "test@example.com"
}
```

Ver usuarios:

```
GET /users/{id}
```

---

# 🧩 **Stack Tecnológico**

| Tecnología           | Uso                        |
| -------------------- | -------------------------- |
| **FastAPI async**    | API asíncrona ultra rápida |
| **SQLAlchemy Async** | ORM asíncrono              |
| **asyncpg**          | Driver PostgreSQL          |
| **Uvicorn**          | Servidor ASGI              |
| **PostgreSQL 16**    | Base de datos              |
| **pgAdmin 4**        | Panel visual               |
| **Docker & Compose** | Orquestación               |

---

# 🧠 **Ventajas del Stack**

* Sin instalaciones locales de PostgreSQL
* Entorno 100% reproducible
* Base persistente mediante volúmenes
* Deploy rápido
* API escalable y moderna (async)
* Panel visual listo (pgAdmin)
* Fácil integración CI/CD

---

# 📦 **Despliegue en producción**

Este proyecto puede desplegarse fácilmente en:

* **Railway**
* **Render**
* **Fly.io**
* **AWS EC2**
* **Google Cloud Run**
* **Azure App Services**

Solo necesitas:

1. Subir tu `docker-compose.yml`
2. Subir tu `Dockerfile`
3. Configurar variables de entorno

---

# 🏁 **Listo!**

Este README documenta **todo el ciclo de vida** del proyecto:
desarrollo, despliegue, administración y debugging.

---

Si quieres, también puedo hacerte:

✅ Una **versión en inglés**
✅ Un **diagrama UML** de la API
✅ Un **diagrama ER** de la base de datos
✅ Un **Makefile** para automatizar comandos
🔧 O agregar **Alembic (async)** para migraciones profesionales.

¿Quieres algo de eso?
