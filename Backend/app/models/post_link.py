import enum
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, BIGINT_PK

class PostLinkType(str, enum.Enum):
    action = "action"
    info = "info"
    resource = "resource"
    meeting = "meeting"
    registration = "registration"
    repo = "repo"
    download = "download"
    other = "other"

class PostLinkDisplayType(str, enum.Enum):
    button = "button"
    link = "link"

class PostLink(Base):
    __tablename__ = "post_links"

    id: Mapped[int] = mapped_column(BIGINT_PK, primary_key=True, autoincrement=True)
    
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)

    label: Mapped[str] = mapped_column(String(120), nullable=False)
    
    url: Mapped[str] = mapped_column(Text, nullable=False)
    
    type: Mapped[PostLinkType] = mapped_column(Enum(PostLinkType, name="post_link_type_enum"), nullable=False)
    
    display_type: Mapped[PostLinkDisplayType] = mapped_column(
        Enum(PostLinkDisplayType, name="post_link_display_enum"),
        nullable=False,
    )
    
    position: Mapped[int] = mapped_column(Integer, nullable=False) # Indica la posición de los botones en el frontend. El 1 representa el botón representativo, el segundo e informativo y el resto en una lista desplegada de botones.

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    post = relationship("Post", back_populates="links")

    __table_args__ = (
        UniqueConstraint("post_id", "position", name="uq_post_links_post_position"),
    )
