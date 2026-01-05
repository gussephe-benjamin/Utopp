from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
def root():
    return {"message": "API funcionando correctamente"}

