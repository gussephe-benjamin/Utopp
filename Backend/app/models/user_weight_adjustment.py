from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BIGINT_PK
from app.models.post import PostType


class UserWeightAdjustment(Base):
    """Delta de personalización (Nivel 2) por usuario, tipo de post y factor de scoring."""

    __tablename__ = "user_weight_adjustments"

    id: Mapped[int] = mapped_column(BIGINT_PK, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    post_type: Mapped[PostType] = mapped_column(
        Enum(PostType, name="post_type_enum"), nullable=False
    )

    factor: Mapped[str] = mapped_column(String(32), nullable=False)

    delta_ema: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    last_event_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("user_id", "post_type", "factor", name="uq_user_weight_adjustments"),
        Index("idx_user_weight_adjustments_user", "user_id"),
    )
