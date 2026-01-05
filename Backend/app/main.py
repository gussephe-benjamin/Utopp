from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.database.session import engine
from app.database.base import Base

# Importa modelos para que SQLAlchemy los registre antes del create_all
from app.models.user import User  # noqa: F401
from app.models.post import Post  # noqa: F401

from app.routers import health, users, auth, posts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    Base.metadata.create_all(bind=engine)

    yield

    # --- SHUTDOWN ---
    # aquí cerrarías recursos si tuvieras (clients, colas, etc.)
    

app = FastAPI(lifespan=lifespan)

app.include_router(health.router)
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])