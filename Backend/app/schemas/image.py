import re
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

# Formato laxo http(s)://<algo>. Deliberadamente NO exige extensión de archivo
# (bancos como picsum.photos/800/600 no tienen extensión en la URL) y el backend
# NUNCA hace fetch de esta URL (evita SSRF) — se guarda tal cual y el navegador
# del cliente es quien la carga vía <img src>.
_HTTP_URL_RE = re.compile(r"^https?://\S+$", re.IGNORECASE)

ImageSourceType = Literal["upload", "external_url"]


class ImageCreate(BaseModel):
    """Schema para crear imagen de post.

    source_type="upload" (default, comportamiento histórico): requiere cloudinary_id.
    source_type="external_url": el usuario pega un link; cloudinary_id es opcional
    (si no se envía, el servicio genera uno sintético a partir de la URL) y url debe
    ser un http(s) bien formado.
    """
    source_type: ImageSourceType = "upload"
    cloudinary_id: Optional[str] = Field(None, min_length=1, max_length=255)
    url: str = Field(..., min_length=1)
    position: int = Field(0, ge=0)
    object_position: Optional[str] = Field(None, max_length=64)
    scale: Optional[float] = Field(None, ge=0.1, le=10.0)

    @model_validator(mode="after")
    def _validate_by_source_type(self) -> "ImageCreate":
        if self.source_type == "upload":
            if not self.cloudinary_id:
                raise ValueError("cloudinary_id es requerido cuando source_type='upload'")
        elif self.source_type == "external_url":
            if not _HTTP_URL_RE.match(self.url.strip()):
                raise ValueError(
                    "url debe ser un enlace http(s) bien formado (ej. https://ejemplo.com/imagen.jpg)"
                )
        return self


class ImageOut(BaseModel):
    """Schema de salida de imagen."""
    id: int
    post_id: int
    cloudinary_id: str
    url: str
    position: int
    object_position: Optional[str] = None
    scale: Optional[float] = None
    source_type: ImageSourceType = "upload"
    created_at: datetime
    
    class Config:
        from_attributes = True


class ImageReorderItem(BaseModel):
    """Item individual para reordenar."""
    image_id: int
    position: int = Field(..., ge=0)


class ImageReorderRequest(BaseModel):
    """Schema para reordenar imágenes."""
    images: List[ImageReorderItem] = Field(..., min_length=1)
