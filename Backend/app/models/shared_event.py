"""Espejo de la tabla de eventos compartida con Utopp Formulario.

El DDL de `formulario.events` lo manda el repo `utopp-formulario` (Alembic).
Aquí solo se declara la estructura para poder leerla e insertar filas: no
modificar columnas sin la migración correspondiente del otro lado.

Va en una Base propia a propósito, para que `Base.metadata.create_all()` de
Plataforma nunca intente crear ni alterar tablas de otro schema.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

FORMULARIO_SCHEMA = "formulario"


class SharedBase(DeclarativeBase):
    """Metadata aparte: no la toca create_all() de Plataforma."""


class SharedEvent(SharedBase):
    __tablename__ = "events"
    __table_args__ = {"schema": FORMULARIO_SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # FK a formulario.users: fila espejo del organizador, resuelta por email.
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    banner_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    theme: Mapped[str | None] = mapped_column(String(40), nullable=True)
    highlights: Mapped[list | None] = mapped_column(JSON, nullable=True)
    allow_only_utec_emails: Mapped[bool] = mapped_column(Boolean, default=False)
    # Columna conservada por compatibilidad; por ahora todos los eventos
    # se listan en Plataforma (filtro de listado suspendido).
    visible_on_plataforma: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
    utopp_post_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    creator_utopp_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class SharedFormularioUser(SharedBase):
    """Organizadores de Utopp Formulario. Plataforma solo lee e inserta."""

    __tablename__ = "users"
    __table_args__ = {"schema": FORMULARIO_SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
