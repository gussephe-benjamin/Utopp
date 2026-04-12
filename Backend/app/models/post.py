import enum
from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, SmallInteger, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

class PostType(str, enum.Enum):
    international_opportunity = "international_opportunity"
    event = "event"
    academic_project = "academic_project"
    announcement = "announcement"
    simple_post = "simple_post"
    
class SubPostType(str, enum.Enum):
    # Oportunidades Internacionales
    intercambio = "intercambio"
    pasantia = "pasantia"
    investigacion = "investigacion"
    cuatro_mas_uno = "4+1"
    
    # Eventos
    conferencia = "conferencia"
    arte = "arte"
    emprendimiento = "emprendimiento"
    hackathon = "hackathon"
    voluntariado = "voluntariado"
    deporte = "deporte"
    visita_academica = "visita_academica"
    empleo = "empleo"
    
    # Proyectos Académicos
    competencia = "competencia"
    proyecto_investigacion = "proyecto_investigacion"
    
    # Anuncios
    comunicado = "comunicado"
    urgente = "urgente"
    
    # Publicaciones Simples
    informativo = "informativo"
    pregunta = "pregunta"
    debate = "debate"

# Mapeo de subtipos válidos por tipo principal
VALID_SUBTYPES = {
    PostType.international_opportunity: [
        SubPostType.intercambio,
        SubPostType.pasantia,
        SubPostType.investigacion,
        SubPostType.cuatro_mas_uno,
    ],

    PostType.event: [
        SubPostType.conferencia,
        SubPostType.arte,
        SubPostType.emprendimiento,
        SubPostType.voluntariado,
        SubPostType.hackathon,
        SubPostType.deporte,
        SubPostType.visita_academica,
        SubPostType.empleo,
    ],
    PostType.academic_project: [
        SubPostType.competencia,
        SubPostType.proyecto_investigacion,
    ],
    PostType.announcement: [
        SubPostType.comunicado,
        SubPostType.urgente,
    ],
    PostType.simple_post: [
        SubPostType.informativo,
        SubPostType.pregunta,
        SubPostType.debate,
    ],
}

class PostStatus(str, enum.Enum):
    draft = "draft"
        
    published = "published"
    
    archived = "archived"

class TimeStatus(str, enum.Enum):
    no_deadline = "no_deadline"
    in_time = "in_time"
    out_of_time = "out_of_time"

class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    status: Mapped[PostStatus] = mapped_column(
        Enum(PostStatus, name="post_status_enum"),
        nullable=False,
        server_default=text("'draft'"),
        index=True,
    )
    
    post_type: Mapped[PostType] = mapped_column(
        Enum(PostType, name="post_type_enum"),
        nullable=False,
        index=True,
    )
    
    subtype: Mapped[SubPostType | None] = mapped_column(
        Enum(SubPostType, name="sub_post_type_enum"),
        nullable=True,
        index=True
    )
    
    @property
    def is_valid_subtype(self) -> bool:
        """Valida que el subtipo corresponda al tipo principal"""
        if not self.subtype:
            return True
        valid = VALID_SUBTYPES.get(self.post_type, [])
        return self.subtype in valid
    
    deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    time_status: Mapped[TimeStatus] = mapped_column(
        Enum(TimeStatus, name="time_status_enum"),
        nullable=False,
        server_default=text("'no_deadline'"),
        index=True,
    )

    is_pinned: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false"), index=True,
    )

    pin_priority: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default=text("0"),
    )

    specific_fields: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    
    tags: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    legacy_source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    legacy_source_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User")
    
    images = relationship(
        "PostImage",
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostImage.position",
    )
    
    links = relationship(
        "PostLink",
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostLink.position",
    )
