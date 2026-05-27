import enum
from datetime import datetime
from sqlalchemy import BigInteger, Enum, ForeignKey, DateTime, UniqueConstraint, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BIGINT_PK


class PostParticipantStatus(str, enum.Enum):
    interested = "interested"
    going = "going"
    attended = "attended"


class PostParticipant(Base):
    __tablename__ = "post_participants"

    id: Mapped[int] = mapped_column(BIGINT_PK, primary_key=True, autoincrement=True)
    
    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    status: Mapped[PostParticipantStatus] = mapped_column(
        Enum(PostParticipantStatus, name="post_participant_status_enum"),
        nullable=False,
        default=PostParticipantStatus.interested
    )
    
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )

    post = relationship("Post")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_participants"),
        Index("idx_post_participants_post_status", "post_id", "status"),
    )
