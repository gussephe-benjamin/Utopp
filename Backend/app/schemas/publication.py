from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator


class PublicationBase(BaseModel):
    """Base schema para todas las publicaciones"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    publication_type: str
    subtype: str
    specific_fields: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


class PublicationCreate(PublicationBase):
    """Schema para crear publicación"""
    user_id: int


class PublicationUpdate(BaseModel):
    """Schema para actualizar publicación"""
    title: Optional[str] = None
    content: Optional[str] = None
    specific_fields: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class PublicationOut(PublicationBase):
    """Schema para salida de publicación"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    priority: int
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# Schemas específicos para cada tipo de publicación

class InternationalOpportunityBase(PublicationBase):
    """Base para oportunidades internacionales"""
    publication_type: str = "oportunidad_internacional"
    
    @validator('subtype')
    def validate_subtype(cls, v):
        allowed_subtypes = ['intercambio', 'pasantia', 'investigacion', '4+1']
        if v not in allowed_subtypes:
            raise ValueError(f'Subtipo debe ser uno de: {allowed_subtypes}')
        return v


class InternationalOpportunityCreate(InternationalOpportunityBase):
    """Crear oportunidad internacional"""
    user_id: int
    
    @validator('specific_fields')
    def validate_specific_fields(cls, v, values):
        subtype = values.get('subtype')
        if subtype == 'intercambio':
            required = ['duration', 'country', 'requirements']
        elif subtype == 'pasantia':
            required = ['company', 'duration', 'remuneration']
        elif subtype == 'investigacion':
            required = ['institution', 'field', 'funding']
        elif subtype == '4+1':
            required = ['university', 'requirements', 'credits']
        
        if v:
            for field in required:
                if field not in v:
                    raise ValueError(f'Campo requerido para {subtype}: {field}')
        return v


class EventBase(PublicationBase):
    """Base para eventos"""
    publication_type: str = "evento"
    
    @validator('subtype')
    def validate_subtype(cls, v):
        allowed_subtypes = ['conferencia', 'arte', 'emprendimiento', 'voluntariado', 
                          'deporte', 'visita_academica', 'empleo']
        if v not in allowed_subtypes:
            raise ValueError(f'Subtipo debe ser uno de: {allowed_subtypes}')
        return v


class EventCreate(EventBase):
    """Crear evento"""
    user_id: int
    
    @validator('specific_fields')
    def validate_specific_fields(cls, v, values):
        subtype = values.get('subtype')
        if subtype == 'conferencia':
            required = ['topic', 'speakers', 'cost']
        elif subtype == 'arte':
            required = ['type', 'artist', 'date']
        elif subtype == 'emprendimiento':
            required = ['sector', 'investment_required']
        elif subtype == 'voluntariado':
            required = ['cause', 'duration', 'requirements']
        elif subtype == 'deporte':
            required = ['discipline', 'level', 'registrations']
        elif subtype == 'visita_academica':
            required = ['institution', 'objective', 'capacity']
        elif subtype == 'empleo':
            required = ['position', 'company', 'requirements']
        
        if v:
            for field in required:
                if field not in v:
                    raise ValueError(f'Campo requerido para {subtype}: {field}')
        return v


class AcademicProjectBase(PublicationBase):
    """Base para proyectos académicos"""
    publication_type: str = "proyecto_academico"
    
    @validator('subtype')
    def validate_subtype(cls, v):
        allowed_subtypes = ['competencia', 'investigacion']
        if v not in allowed_subtypes:
            raise ValueError(f'Subtipo debe ser uno de: {allowed_subtypes}')
        return v


class AcademicProjectCreate(AcademicProjectBase):
    """Crear proyecto académico"""
    user_id: int
    
    @validator('specific_fields')
    def validate_specific_fields(cls, v, values):
        subtype = values.get('subtype')
        if subtype == 'competencia':
            required = ['category', 'rules', 'prizes']
        elif subtype == 'investigacion':
            required = ['field', 'methodology', 'results']
        
        if v:
            for field in required:
                if field not in v:
                    raise ValueError(f'Campo requerido para {subtype}: {field}')
        return v


class AnnouncementBase(PublicationBase):
    """Base para anuncios"""
    publication_type: str = "anuncio"
    
    @validator('subtype')
    def validate_subtype(cls, v):
        allowed_subtypes = ['comunicado', 'urgente']
        if v not in allowed_subtypes:
            raise ValueError(f'Subtipo debe ser uno de: {allowed_subtypes}')
        return v


class AnnouncementCreate(AnnouncementBase):
    """Crear anuncio"""
    user_id: int
    
    @validator('specific_fields')
    def validate_specific_fields(cls, v, values):
        subtype = values.get('subtype')
        if subtype == 'comunicado':
            required = ['urgency', 'audience']
        elif subtype == 'urgente':
            required = ['urgency', 'audience', 'valid_until']
        
        if v:
            for field in required:
                if field not in v:
                    raise ValueError(f'Campo requerido para {subtype}: {field}')
        return v


class SimplePostBase(PublicationBase):
    """Base para publicaciones simples"""
    publication_type: str = "publicacion_simple"
    
    @validator('subtype')
    def validate_subtype(cls, v):
        allowed_subtypes = ['informativo', 'pregunta', 'debate']
        if v not in allowed_subtypes:
            raise ValueError(f'Subtipo debe ser uno de: {allowed_subtypes}')
        return v


class SimplePostCreate(SimplePostBase):
    """Crear publicación simple"""
    user_id: int
    
    @validator('specific_fields')
    def validate_specific_fields(cls, v, values):
        subtype = values.get('subtype')
        if subtype in ['informativo', 'pregunta', 'debate']:
            required = ['mood', 'visibility']
        
        if v:
            for field in required:
                if field not in v:
                    raise ValueError(f'Campo requerido para {subtype}: {field}')
        return v


# Schema para obtener tipos y subtipos disponibles
class PublicationType(BaseModel):
    """Schema para tipos de publicación"""
    type: str
    subtypes: List[str]
    description: str
    icon: str


class PublicationTypesResponse(BaseModel):
    """Respuesta con todos los tipos disponibles"""
    types: List[PublicationType]
