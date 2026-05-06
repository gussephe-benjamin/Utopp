"""Endpoints públicos y autenticados para términos y aceptación."""

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.legal import AcceptTermsIn, AcceptTermsOut, TermsCurrentOut
from app.services import legal_service

router = APIRouter()


@router.get("/terms/current", response_model=TermsCurrentOut)
def get_current_terms(db: Session = Depends(get_db)):
    doc = legal_service.get_active_terms_document(db)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay términos publicados",
        )
    return doc


@router.post("/accept", response_model=AcceptTermsOut)
def accept_terms(
    body: AcceptTermsIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    active = legal_service.get_active_terms_document(db)
    if active is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay términos activos para aceptar",
        )
    if body.document_id != active.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="document_id no coincide con la versión vigente",
        )

    if idempotency_key and len(idempotency_key) > 64:
        raise HTTPException(status_code=400, detail="Idempotency-Key demasiado largo")

    fwd = request.headers.get("x-forwarded-for")
    ip = (fwd.split(",")[0].strip() if fwd else None) or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")

    row = legal_service.record_acceptance(
        db,
        user_id=current_user.id,
        legal_document_id=active.id,
        ip_address=ip,
        user_agent=ua,
        idempotency_key=idempotency_key,
    )

    return AcceptTermsOut(
        ok=True,
        legal_document_id=row.legal_document_id,
        accepted_at=row.accepted_at,
    )
