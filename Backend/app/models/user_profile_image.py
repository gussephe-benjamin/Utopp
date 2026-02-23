from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserProfileImage(Base):
    __tablename__ = "user_profile_images"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    cloudinary_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    
    url: Mapped[str] = mapped_column(Text, nullable=False)
    
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("user_id", "position", name="uq_user_profile_images_user_position"),
        Index(
            "idx_user_profile_images_user_created_at",
            "user_id",
            "created_at",
        ),
        Index(
            "uq_user_profile_images_user_active",
            "user_id",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )
