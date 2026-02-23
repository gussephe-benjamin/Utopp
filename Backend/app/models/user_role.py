from datetime import datetime
from sqlalchemy import ForeignKey, SmallInteger, DateTime, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        primary_key=True
    )
    
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), 
        primary_key=True,
        index=True
    )
    
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    user = relationship("User")
    role = relationship("Role")

    __table_args__ = (
        Index("idx_user_roles_role_id", "role_id"),
    )
