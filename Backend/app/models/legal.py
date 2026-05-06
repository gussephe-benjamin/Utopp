"""Modelos para documentos legales versionados y evidencia de aceptación."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    effective_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    superseded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("legal_documents.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    acceptances: Mapped[list["TermsAcceptance"]] = relationship(
        "TermsAcceptance", back_populates="legal_document"
    )


class TermsAcceptance(Base):
    __tablename__ = "terms_acceptances"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    legal_document_id: Mapped[int] = mapped_column(
        ForeignKey("legal_documents.id"), nullable=False, index=True
    )
    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    auth_method: Mapped[str] = mapped_column(String(32), default="google_oauth", nullable=False)
    document_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)

    legal_document: Mapped["LegalDocument"] = relationship(
        "LegalDocument", back_populates="acceptances"
    )
