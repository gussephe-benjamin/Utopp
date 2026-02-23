from datetime import datetime
from sqlalchemy import BigInteger, ForeignKey, DateTime, UniqueConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Follow(Base):
    __tablename__ = "follows"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    follower_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    following_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    follower = relationship("User", foreign_keys=[follower_id])
    
    following = relationship("User", foreign_keys=[following_id])

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follows_follower_following"),
        Index("idx_follows_following_created", "following_id", "created_at"),
    )
