from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


# ============================================================
# GET /health
# Health check del servidor. Devuelve un mensaje simple
# para confirmar que la API está funcionando.
# Auth: No requerida
# ============================================================
@router.get("/")
def root():
    return {"message": "API funcionando correctamente"}

