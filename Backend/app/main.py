from fastapi import FastAPI
from contextlib import asynccontextmanager
import os
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine
from app.database.base import Base
from app.database.migrations import run_migrations

from app.routers import (
    health,
    auth,
    googleAuth,
    setup,
    onboardings,
    users,
    posts,
    post_images,
    post_links,
    feed,
    saved_posts,
    participants,
    roles,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
   
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)

    yield

    # --- SHUTDOWN ---


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok"}


# ═══════════════════════════════════════════════════════════
# AUTENTICACIÓN
# ═══════════════════════════════════════════════════════════
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(googleAuth.router, prefix="/google", tags=["google-auth"])
app.include_router(setup.router, prefix="/setup", tags=["setup"])

# ═══════════════════════════════════════════════════════════
# USUARIOS Y ONBOARDING
# ═══════════════════════════════════════════════════════════
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(onboardings.router, prefix="/onboarding", tags=["onboarding"])

# ═══════════════════════════════════════════════════════════
# POSTS Y CONTENIDO
# ═══════════════════════════════════════════════════════════
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(post_images.router, tags=["post-images"])
app.include_router(post_links.router, tags=["post-links"])
app.include_router(saved_posts.router, tags=["saved-posts"])

# ═══════════════════════════════════════════════════════════
# FEED Y PARTICIPACIÓN
# ═══════════════════════════════════════════════════════════
app.include_router(feed.router, tags=["feed"])
app.include_router(participants.router, tags=["participants"])

# ═══════════════════════════════════════════════════════════
# ADMINISTRACIÓN
# ═══════════════════════════════════════════════════════════
app.include_router(roles.router, prefix="/roles", tags=["roles"])
