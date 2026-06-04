from datetime import datetime
from sqlalchemy import String, DateTime, func, Boolean, JSON, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    career: Mapped[str | None] = mapped_column(String(255), nullable=True)
    interests: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    availability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weekly_availability: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    contacts: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    cycle: Mapped[int | None] = mapped_column(Integer, nullable= True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    contacts: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    google_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    last_accepted_legal_document_id: Mapped[int | None] = mapped_column(
        ForeignKey("legal_documents.id"), nullable=True, index=True
    )
    last_accepted_privacy_document_id: Mapped[int | None] = mapped_column(
        ForeignKey("legal_documents.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

