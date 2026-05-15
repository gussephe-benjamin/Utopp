"""Endpoints públicos y autenticados para términos, privacidad y aceptación."""

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.legal import AcceptLegalIn, AcceptLegalOut, AcceptedPartOut, TermsCurrentOut
from app.services import legal_service

router = APIRouter()


def _client_ip_ua(request: Request) -> tuple[str | None, str | None]:
    fwd = request.headers.get("x-forwarded-for")
    ip = (fwd.split(",")[0].strip() if fwd else None) or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
    return ip, ua


@router.get("/terms/current", response_model=TermsCurrentOut)
def get_current_terms(db: Session = Depends(get_db)):
    doc = legal_service.get_active_legal_document(db, legal_service.TERMS_SLUG)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay términos publicados",
        )
    return doc


@router.get("/privacy/current", response_model=TermsCurrentOut)
def get_current_privacy(db: Session = Depends(get_db)):
    doc = legal_service.get_active_legal_document(db, legal_service.PRIVACY_SLUG)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay política de privacidad publicada",
        )
    return doc


@router.post("/accept", response_model=AcceptLegalOut)
def accept_legal(
    body: AcceptLegalIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    active_terms = legal_service.get_active_legal_document(db, legal_service.TERMS_SLUG)
    active_privacy = legal_service.get_active_legal_document(db, legal_service.PRIVACY_SLUG)

    if idempotency_key and len(idempotency_key) > 64:
        raise HTTPException(status_code=400, detail="Idempotency-Key demasiado largo")

    ip, ua = _client_ip_ua(request)
    out_terms: AcceptedPartOut | None = None
    out_privacy: AcceptedPartOut | None = None

    terms_id = body.resolved_terms_document_id()
    if terms_id is not None:
        if active_terms is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No hay términos activos para aceptar",
            )
        if terms_id != active_terms.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="terms_document_id no coincide con el documento vigente",
            )
        row = legal_service.record_acceptance(
            db,
            user_id=current_user.id,
            legal_document_id=active_terms.id,
            ip_address=ip,
            user_agent=ua,
            idempotency_key=idempotency_key,
        )
        out_terms = AcceptedPartOut(
            legal_document_id=row.legal_document_id,
            accepted_at=row.accepted_at,
        )

    if body.privacy_document_id is not None:
        if active_privacy is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No hay política de privacidad activa para aceptar",
            )
        if body.privacy_document_id != active_privacy.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="privacy_document_id no coincide con el documento vigente",
            )
        row_p = legal_service.record_acceptance(
            db,
            user_id=current_user.id,
            legal_document_id=active_privacy.id,
            ip_address=ip,
            user_agent=ua,
            idempotency_key=idempotency_key,
        )
        out_privacy = AcceptedPartOut(
            legal_document_id=row_p.legal_document_id,
            accepted_at=row_p.accepted_at,
        )

    return AcceptLegalOut(ok=True, terms=out_terms, privacy=out_privacy)
