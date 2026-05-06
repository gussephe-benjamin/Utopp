"""Lógica de negocio para términos versionados y aceptaciones."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.legal import LegalDocument, TermsAcceptance
from app.models.user import User

TERMS_SLUG = "terms"

# Texto inicial MVP; sustituir por contenido legal revisado.
_INITIAL_TERMS_MARKDOWN = """# Términos y condiciones de uso (versión 1)

Al usar Utopp aceptas estas condiciones. Este es un texto placeholder publicado automáticamente.
Contacta al equipo para el documento legal definitivo.
"""


def _hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def get_active_terms_document(db: Session, slug: str = TERMS_SLUG) -> LegalDocument | None:
    stmt = select(LegalDocument).where(
        LegalDocument.slug == slug,
        LegalDocument.is_active.is_(True),
    )
    return db.scalar(stmt)


def user_has_valid_terms(db: Session, user_id: int, slug: str = TERMS_SLUG) -> bool:
    active = get_active_terms_document(db, slug=slug)
    if active is None:
        # Sin documento activo: no exigir aceptación hasta que exista versión publicada
        return True

    user = db.get(User, user_id)
    if user is None:
        return False

    if user.last_accepted_legal_document_id == active.id:
        return True

    stmt = select(TermsAcceptance.id).where(
        TermsAcceptance.user_id == user_id,
        TermsAcceptance.legal_document_id == active.id,
    )
    return db.scalar(stmt) is not None


def seed_initial_terms_if_absent(db: Session) -> None:
    """Crea versión 1 activa si no hay ningún documento legal."""
    existing = db.scalar(select(LegalDocument.id).limit(1))
    if existing is not None:
        return

    h = _hash_content(_INITIAL_TERMS_MARKDOWN)
    doc = LegalDocument(
        slug=TERMS_SLUG,
        version="1",
        title="Términos y condiciones",
        content=_INITIAL_TERMS_MARKDOWN,
        content_sha256=h,
        is_active=True,
    )
    db.add(doc)
    db.commit()


def record_acceptance(
    db: Session,
    *,
    user_id: int,
    legal_document_id: int,
    ip_address: str | None,
    user_agent: str | None,
    idempotency_key: str | None,
    auth_method: str = "google_oauth",
) -> TermsAcceptance:
    if idempotency_key:
        stmt = select(TermsAcceptance).where(TermsAcceptance.idempotency_key == idempotency_key)
        existing = db.scalar(stmt)
        if existing is not None:
            return existing

    dup_stmt = select(TermsAcceptance).where(
        TermsAcceptance.user_id == user_id,
        TermsAcceptance.legal_document_id == legal_document_id,
    )
    dup = db.scalar(dup_stmt)
    if dup is not None:
        user = db.get(User, user_id)
        if user and user.last_accepted_legal_document_id != legal_document_id:
            user.last_accepted_legal_document_id = legal_document_id
            db.commit()
        return dup

    doc = db.get(LegalDocument, legal_document_id)
    document_hash = doc.content_sha256 if doc else None

    row = TermsAcceptance(
        user_id=user_id,
        legal_document_id=legal_document_id,
        ip_address=ip_address,
        user_agent=(user_agent[:512] if user_agent else None),
        auth_method=auth_method,
        document_hash=document_hash,
        idempotency_key=idempotency_key,
    )
    db.add(row)
    user = db.get(User, user_id)
    if user:
        user.last_accepted_legal_document_id = legal_document_id
    db.commit()
    db.refresh(row)
    return row
