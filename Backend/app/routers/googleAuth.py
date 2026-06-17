from app.database.session import get_db
from app.schemas.user import GoogleRegisterIn, GoogleLoginIn
from app.services.users_service import get_user_by_email, create_google_user
from app.services.google_token_service import authenticate_google_token
from app.core.security import create_access_token

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

router = APIRouter()


# ============================================================
# POST /register
# Registra un nuevo usuario usando su token de Google OAuth.
# Verifica el token criptográficamente, aplica guard UTEC (hd +
# email_verified + @utec.edu.pe), crea el usuario y devuelve JWT.
# Auth: No requerida (usa token de Google)
# ============================================================
@router.post("/register")
def google_register(payload: GoogleRegisterIn, request: Request, db: Session = Depends(get_db)):
    from app.services import legal_service

    if not legal_service.register_legal_ids_match_active(
        db, payload.terms_document_id, payload.privacy_document_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los documentos legales indicados no coinciden con los vigentes. Recarga la página e inténtalo de nuevo.",
        )

    identity = authenticate_google_token(payload.token)

    user = get_user_by_email(db, identity.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya está registrado",
        )

    user = create_google_user(
        db=db,
        email=identity.email,
        full_name=identity.name,
        google_id=identity.google_id,
    )

    fwd = request.headers.get("x-forwarded-for")
    ip = (fwd.split(",")[0].strip() if fwd else None) or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
    legal_service.record_acceptances_for_documents(
        db,
        user_id=user.id,
        document_ids=[payload.terms_document_id, payload.privacy_document_id],
        ip_address=ip,
        user_agent=ua,
        auth_method="google_oauth_register",
        commit=True,
    )

    access_token = create_access_token(str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# POST /login
# Autentica un usuario existente usando su token de Google.
# Verifica el token criptográficamente y aplica guard UTEC antes
# de buscar al usuario o emitir JWT.
# Auth: No requerida (usa token de Google)
# ============================================================
@router.post("/login")
def google_login(payload: GoogleLoginIn, db: Session = Depends(get_db)):
    identity = authenticate_google_token(payload.token)

    user = get_user_by_email(db, identity.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no registrado",
        )

    if not user.google_id:
        user.google_id = identity.google_id
        db.commit()

    access_token = create_access_token(str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
