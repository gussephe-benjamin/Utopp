from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSON

from app.database.base import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_virtual: Mapped[bool] = mapped_column(Boolean, default=False)

    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    category: Mapped[str | None] = mapped_column(String(50), nullable=True)  # academic | community | institutional
    popularity: Mapped[int] = mapped_column(Integer, default=0)

    min_cycle: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_cycle: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_by = relationship("User")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
