"""Lógica de negocio para documentos legales (términos + privacidad) y aceptaciones."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.legal import LegalDocument, TermsAcceptance
from app.models.user import User

TERMS_SLUG = "terms"
PRIVACY_SLUG = "privacy"
REQUIRED_LEGAL_SLUGS = (TERMS_SLUG, PRIVACY_SLUG)
_LIVE_VERSION = "live"

_LEGAL_DIR = Path(__file__).resolve().parent.parent / "legal"
_TERMS_MARKDOWN_PATH = _LEGAL_DIR / "terms.md"
_PRIVACY_MARKDOWN_PATH = _LEGAL_DIR / "privacy.md"

_FALLBACK_INITIAL_MARKDOWN = """# Términos y condiciones de uso

Al usar Utopp aceptas estas condiciones. Este es un texto placeholder.
Contacta al equipo para el documento legal definitivo.
"""

_FALLBACK_PRIVACY_MARKDOWN = """# Política de datos y privacidad

Describe aquí cómo Utopp trata los datos personales. Texto placeholder.
"""


def terms_markdown_file_path() -> Path:
    return _TERMS_MARKDOWN_PATH


def privacy_markdown_file_path() -> Path:
    return _PRIVACY_MARKDOWN_PATH


def load_terms_markdown_from_repo() -> str:
    if _TERMS_MARKDOWN_PATH.is_file():
        return _TERMS_MARKDOWN_PATH.read_text(encoding="utf-8")
    return _FALLBACK_INITIAL_MARKDOWN


def load_privacy_markdown_from_repo() -> str:
    if _PRIVACY_MARKDOWN_PATH.is_file():
        return _PRIVACY_MARKDOWN_PATH.read_text(encoding="utf-8")
    return _FALLBACK_PRIVACY_MARKDOWN


def _hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def get_active_legal_document(db: Session, slug: str) -> LegalDocument | None:
    stmt = select(LegalDocument).where(
        LegalDocument.slug == slug,
        LegalDocument.is_active.is_(True),
    )
    return db.scalar(stmt)


def get_active_terms_document(db: Session, slug: str = TERMS_SLUG) -> LegalDocument | None:
    return get_active_legal_document(db, slug)


def _slug_title(slug: str) -> str:
    if slug == PRIVACY_SLUG:
        return "Política de datos y privacidad"
    return "Términos y condiciones"


def _markdown_for_slug(slug: str) -> str:
    if slug == PRIVACY_SLUG:
        return load_privacy_markdown_from_repo()
    return load_terms_markdown_from_repo()


def sync_legal_documents_from_repo(db: Session) -> None:
    """
    Crea o actualiza en sitio la fila activa por slug desde los Markdown del repo.
    Mantiene el mismo ``id`` al actualizar contenido (no invalida aceptaciones previas).

    En cada sincronización de una fila existente se actualizan ``published_at`` y
    ``effective_at`` a la hora UTC actual para que la API refleje la vigencia del texto servido.
    """
    now = datetime.now(timezone.utc)
    for slug in REQUIRED_LEGAL_SLUGS:
        content = _markdown_for_slug(slug)
        h = _hash_content(content)
        title = _slug_title(slug)
        active = get_active_legal_document(db, slug)
        if active is None:
            doc = LegalDocument(
                slug=slug,
                version=_LIVE_VERSION,
                title=title,
                content=content,
                content_sha256=h,
                is_active=True,
                published_at=now,
                effective_at=now,
            )
            db.add(doc)
        else:
            active.content = content
            active.content_sha256 = h
            active.title = title
            active.version = _LIVE_VERSION
            active.published_at = now
            active.effective_at = now
    db.commit()


def user_accepted_active_document(db: Session, user_id: int, doc: LegalDocument) -> bool:
    user = db.get(User, user_id)
    if user is None:
        return False
    if doc.slug == TERMS_SLUG and user.last_accepted_legal_document_id == doc.id:
        return True
    if doc.slug == PRIVACY_SLUG and user.last_accepted_privacy_document_id == doc.id:
        return True
    stmt = select(TermsAcceptance.id).where(
        TermsAcceptance.user_id == user_id,
        TermsAcceptance.legal_document_id == doc.id,
    )
    return db.scalar(stmt) is not None


def user_has_required_legal_consent(db: Session, user_id: int) -> bool:
    """True si el usuario tiene aceptación registrada para cada documento activo requerido."""
    for slug in REQUIRED_LEGAL_SLUGS:
        active = get_active_legal_document(db, slug)
        if active is None:
            continue
        if not user_accepted_active_document(db, user_id, active):
            return False
    return True


def user_has_valid_terms(db: Session, user_id: int, slug: str = TERMS_SLUG) -> bool:
    """Compatibilidad: consentimiento completo (términos + privacidad cuando existan activos)."""
    return user_has_required_legal_consent(db, user_id)


def needs_terms_consent(db: Session, user_id: int) -> bool:
    doc = get_active_legal_document(db, TERMS_SLUG)
    if doc is None:
        return False
    return not user_accepted_active_document(db, user_id, doc)


def needs_privacy_consent(db: Session, user_id: int) -> bool:
    doc = get_active_legal_document(db, PRIVACY_SLUG)
    if doc is None:
        return False
    return not user_accepted_active_document(db, user_id, doc)


def publish_terms_from_markdown(
    db: Session,
    *,
    markdown: str,
    version: str,
    title: str | None = "Términos y condiciones",
    slug: str = TERMS_SLUG,
) -> LegalDocument:
    """
    Deprecado para flujo diario: preferir editar Markdown y ``sync_legal_documents_from_repo``.
    Mantiene API por compatibilidad con scripts antiguos (sigue creando nueva fila).
    """
    old = get_active_legal_document(db, slug)
    if old is not None:
        old.is_active = False
        db.flush()

    h = _hash_content(markdown)
    new_doc = LegalDocument(
        slug=slug,
        version=version,
        title=title,
        content=markdown,
        content_sha256=h,
        is_active=True,
    )
    db.add(new_doc)
    db.flush()

    if old is not None:
        old.superseded_by_id = new_doc.id

    db.commit()
    db.refresh(new_doc)
    return new_doc


def record_acceptance(
    db: Session,
    *,
    user_id: int,
    legal_document_id: int,
    ip_address: str | None,
    user_agent: str | None,
    idempotency_key: str | None,
    auth_method: str = "google_oauth",
    commit: bool = True,
) -> TermsAcceptance:
    if idempotency_key:
        stmt = select(TermsAcceptance).where(TermsAcceptance.idempotency_key == idempotency_key)
        existing = db.scalar(stmt)
        if existing is not None:
            _sync_user_last_accepted_for_document(db, user_id, existing.legal_document_id)
            if commit:
                db.commit()
            else:
                db.flush()
            return existing

    dup_stmt = select(TermsAcceptance).where(
        TermsAcceptance.user_id == user_id,
        TermsAcceptance.legal_document_id == legal_document_id,
    )
    dup = db.scalar(dup_stmt)
    if dup is not None:
        _sync_user_last_accepted_for_document(db, user_id, legal_document_id)
        if commit:
            db.commit()
        else:
            db.flush()
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
    _sync_user_last_accepted_for_document(db, user_id, legal_document_id)
    if commit:
        db.commit()
    else:
        db.flush()
    db.refresh(row)
    return row


def _sync_user_last_accepted_for_document(db: Session, user_id: int, legal_document_id: int) -> None:
    user = db.get(User, user_id)
    doc = db.get(LegalDocument, legal_document_id)
    if not user or not doc:
        return
    if doc.slug == TERMS_SLUG:
        user.last_accepted_legal_document_id = legal_document_id
    elif doc.slug == PRIVACY_SLUG:
        user.last_accepted_privacy_document_id = legal_document_id


def register_legal_ids_match_active(db: Session, terms_id: int, privacy_id: int) -> bool:
    """True si los ids enviados en registro coinciden con los documentos activos actuales."""
    at = get_active_legal_document(db, TERMS_SLUG)
    ap = get_active_legal_document(db, PRIVACY_SLUG)
    if at is None or ap is None:
        return False
    return terms_id == at.id and privacy_id == ap.id


def record_acceptances_for_documents(
    db: Session,
    *,
    user_id: int,
    document_ids: list[int],
    ip_address: str | None,
    user_agent: str | None,
    auth_method: str = "registration",
    commit: bool = True,
) -> None:
    for doc_id in document_ids:
        record_acceptance(
            db,
            user_id=user_id,
            legal_document_id=doc_id,
            ip_address=ip_address,
            user_agent=user_agent,
            idempotency_key=None,
            auth_method=auth_method,
            commit=False,
        )
    if commit:
        db.commit()
