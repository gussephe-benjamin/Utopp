from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BIGINT_PK


class PostImage(Base):
    __tablename__ = "post_images"

    id: Mapped[int] = mapped_column(BIGINT_PK, primary_key=True, autoincrement=True)
    
    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )

    cloudinary_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    
    url: Mapped[str] = mapped_column(Text, nullable=False)
    
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    object_position: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    scale: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("Post", back_populates="images")

    __table_args__ = (
        UniqueConstraint("post_id", "position", name="uq_post_images_post_position"),
    )
