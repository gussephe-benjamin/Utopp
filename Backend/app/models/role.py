from sqlalchemy import SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
