from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Boolean, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSON

from app.database.base import Base


class Publication(Base):
    """
    Modelo base abstracto para todas las publicaciones.
    Contiene los campos comunes a todos los tipos de publicación.
    """
    __abstract__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    publication_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    subtype: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    specific_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Campos específicos por subtipo
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    priority: Mapped[int] = mapped_column(Integer, default=0, index=True)

    # Relación común con el usuario
    user = relationship("User")


class InternationalOpportunity(Publication):
    """
    Oportunidades Internacionales: Intercambios, Pasantías, Investigación, 4+1
    """
    __tablename__ = "international_opportunities"

    # Herencia de Publication
    __mapper_args__ = {
        'polymorphic_identity': 'international_opportunity',
        'concrete': True
    }


class Event(Publication):
    """
    Eventos: Conferencias, Arte, Emprendimiento, Voluntariado, Deporte, Visitas Académicas, Empleo
    """
    __tablename__ = "events"

    # Herencia de Publication
    __mapper_args__ = {
        'polymorphic_identity': 'event',
        'concrete': True
    }


class AcademicProject(Publication):
    """
    Proyectos Académicos: Competencias, Investigaciones
    """
    __tablename__ = "academic_projects"

    # Herencia de Publication
    __mapper_args__ = {
        'polymorphic_identity': 'academic_project',
        'concrete': True
    }


class Announcement(Publication):
    """
    Anuncios y Comunicados institucionales
    """
    __tablename__ = "announcements"

    # Herencia de Publication
    __mapper_args__ = {
        'polymorphic_identity': 'announcement',
        'concrete': True
    }


class SimplePost(Publication):
    """
    Publicaciones simples del feed
    """
    __tablename__ = "simple_posts"

    # Herencia de Publication
    __mapper_args__ = {
        'polymorphic_identity': 'simple_post',
        'concrete': True
    }
