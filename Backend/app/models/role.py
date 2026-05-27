from sqlalchemy import Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    identifier: Mapped[int] = mapped_column(SmallInteger, nullable=False, unique=True)

    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
