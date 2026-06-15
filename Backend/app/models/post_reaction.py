from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BIGINT_PK


class PostReaction(Base):
    __tablename__ = "post_reactions"

    id: Mapped[int] = mapped_column(BIGINT_PK, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User")
    post = relationship("Post")

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_post_reactions_user_post"),
        Index("idx_post_reactions_post", "post_id"),
    )
