from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class SavedPost(Base):
    __tablename__ = "saved_posts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)

    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")
    
    post = relationship("Post")

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_saved_posts_user_post"),
        Index("idx_saved_posts_user_saved_at", "user_id", "saved_at"),
    )
