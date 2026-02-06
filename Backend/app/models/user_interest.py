from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class UserInterest(Base):
    __tablename__ = "user_interests"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    interest: Mapped[str] = mapped_column(String(100), index=True)
