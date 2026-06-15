from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BIGINT_PK


class PostComment(Base):
    __tablename__ = "post_comments"

    id: Mapped[int] = mapped_column(BIGINT_PK, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    user = relationship("User")
    post = relationship("Post")

    __table_args__ = (
        Index("idx_post_comments_post_created", "post_id", "created_at"),
    )
