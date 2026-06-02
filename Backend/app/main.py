from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import time
import uuid
import logging
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, SessionLocal
from app.database.base import Base
from app.database.migrations import run_migrations
from app.services import role_service
from app.models import legal as _legal_models  # noqa: F401 — registra tablas legales en metadata
logger = logging.getLogger("utopp.api")
_slow_request_ms = int(os.getenv("SLOW_REQUEST_MS", "1000"))


from app.routers import (
    health,
    auth,
    googleAuth,
    legal,
    setup,
    onboardings,
    users,
    posts,
    post_images,
    post_links,
    user_profile_images,
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
    db = SessionLocal()
    try:
        role_service.seed_default_roles_if_empty(db)
        from app.services import legal_service

        legal_service.sync_legal_documents_from_repo(db)
    finally:
        db.close()

    yield

    # --- SHUTDOWN ---


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://utopp-fronted.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://www.utopp.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    response.headers["x-request-id"] = request_id
    response.headers["x-response-time-ms"] = f"{elapsed_ms:.2f}"
    if elapsed_ms >= _slow_request_ms:
        logger.warning(
            "slow_request request_id=%s method=%s path=%s status=%s elapsed_ms=%.2f",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
    )


@app.get("/")
def root_check():
    return {"status": "ok"}


# ═══════════════════════════════════════════════════════════
# AUTENTICACIÓN
# ═══════════════════════════════════════════════════════════
app.include_router(health.router)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(googleAuth.router, prefix="/google", tags=["google-auth"])
app.include_router(legal.router, prefix="/legal", tags=["legal"])
app.include_router(setup.router, prefix="/setup", tags=["setup"])

# ═══════════════════════════════════════════════════════════
# USUARIOS Y ONBOARDING
# ═══════════════════════════════════════════════════════════
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(user_profile_images.router, prefix="/users", tags=["user-profile-images"])
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

