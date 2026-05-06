from datetime import datetime

from pydantic import BaseModel, Field


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
