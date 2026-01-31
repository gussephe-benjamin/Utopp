from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine
from app.database.base import Base

from app.routers import health, users, auth, posts, onboardings, googleAuth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    Base.metadata.create_all(bind=engine)

    yield

    # --- SHUTDOWN ---
    # aquí cerrarías recursos si tuvieras (clients, colas, etc.)
    
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(onboardings.router, prefix="/onboarding", tags=["posts"])
app.include_router(googleAuth.router, prefix="/google", tags=["posts"])