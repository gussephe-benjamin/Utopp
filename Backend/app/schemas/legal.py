from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class TermsCurrentOut(BaseModel):
    id: int
    slug: str
    version: str
    title: str | None
    effective_at: datetime
    published_at: datetime
    content: str
    content_sha256: str | None = None

    model_config = {"from_attributes": True}


class AcceptTermsIn(BaseModel):
    document_id: int = Field(..., ge=1)


class AcceptTermsOut(BaseModel):
    ok: bool
    legal_document_id: int
    accepted_at: datetime


class AcceptedPartOut(BaseModel):
    legal_document_id: int
    accepted_at: datetime


class AcceptLegalIn(BaseModel):
    """Acepta uno o ambos documentos vigentes (ids deben coincidir con los activos)."""

    terms_document_id: int | None = Field(default=None, ge=1)
    privacy_document_id: int | None = Field(default=None, ge=1)
    document_id: int | None = Field(
        default=None,
        ge=1,
        description="Alias legacy: equivale a terms_document_id si este no se envía",
    )

    @model_validator(mode="after")
    def at_least_one(self) -> "AcceptLegalIn":
        has_terms = (
            self.terms_document_id is not None or self.document_id is not None
        )
        if not has_terms and self.privacy_document_id is None:
            raise ValueError("Debes enviar terms_document_id (o document_id) y/o privacy_document_id")
        return self

    def resolved_terms_document_id(self) -> int | None:
        return self.terms_document_id if self.terms_document_id is not None else self.document_id


class AcceptLegalOut(BaseModel):
    ok: bool
    terms: AcceptedPartOut | None = None
    privacy: AcceptedPartOut | None = None
