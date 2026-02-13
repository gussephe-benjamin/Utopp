from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.publication import (
    PublicationCreate, PublicationUpdate, PublicationOut,
    InternationalOpportunityCreate, EventCreate, AcademicProjectCreate,
    AnnouncementCreate, SimplePostCreate,
    PublicationType, PublicationTypesResponse
)
from app.models.publication import (
    InternationalOpportunity, Event, AcademicProject,
    Announcement, SimplePost
)
from app.models.user import User

router = APIRouter(prefix="/publications", tags=["publications"])


# Tipos y subtipos disponibles
PUBLICATION_TYPES = [
    PublicationType(
        type="oportunidad_internacional",
        subtypes=["intercambio", "pasantia", "investigacion", "4+1"],
        description="Oportunidades de estudio y trabajo en el extranjero",
        icon="🌍"
    ),
    PublicationType(
        type="evento",
        subtypes=["conferencia", "arte", "emprendimiento", "voluntariado", 
                 "deporte", "visita_academica", "empleo"],
        description="Eventos académicos y sociales",
        icon="📅"
    ),
    PublicationType(
        type="proyecto_academico",
        subtypes=["competencia", "investigacion"],
        description="Proyectos de investigación y competencias académicas",
        icon="🔬"
    ),
    PublicationType(
        type="anuncio",
        subtypes=["comunicado", "urgente"],
        description="Anuncios y comunicados institucionales",
        icon="📢"
    ),
    PublicationType(
        type="publicacion_simple",
        subtypes=["informativo", "pregunta", "debate"],
        description="Publicaciones generales de la comunidad",
        icon="💬"
    )
]


@router.get("/types", response_model=PublicationTypesResponse)
async def get_publication_types():
    """
    Obtiene todos los tipos y subtipos de publicación disponibles
    """
    return PublicationTypesResponse(types=PUBLICATION_TYPES)


@router.post("/", response_model=PublicationOut)
async def create_publication(
    publication: PublicationCreate,
    db: Session = Depends(get_db)
):
    """
    Crea una nueva publicación según su tipo
    """
    try:
        # Determinar el modelo específico según el tipo
        publication_type = publication.publication_type
        
        if publication_type == "oportunidad_internacional":
            # Validar como oportunidad internacional
            opportunity_data = InternationalOpportunityCreate(**publication.dict())
            db_publication = InternationalOpportunity(**opportunity_data.dict())
            
        elif publication_type == "evento":
            # Validar como evento
            event_data = EventCreate(**publication.dict())
            db_publication = Event(**event_data.dict())
            
        elif publication_type == "proyecto_academico":
            # Validar como proyecto académico
            project_data = AcademicProjectCreate(**publication.dict())
            db_publication = AcademicProject(**project_data.dict())
            
        elif publication_type == "anuncio":
            # Validar como anuncio
            announcement_data = AnnouncementCreate(**publication.dict())
            db_publication = Announcement(**announcement_data.dict())
            
        elif publication_type == "publicacion_simple":
            # Validar como publicación simple
            simple_data = SimplePostCreate(**publication.dict())
            db_publication = SimplePost(**simple_data.dict())
            
        else:
            raise HTTPException(status_code=400, detail="Tipo de publicación no válido")
        
        # Obtener información del usuario
        user = db.query(User).filter(User.id == publication.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Guardar en base de datos
        db.add(db_publication)
        db.commit()
        db.refresh(db_publication)
        
        # Preparar respuesta
        response_data = {
            **db_publication.__dict__,
            "user_name": user.full_name
        }
        
        return PublicationOut(**response_data)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[PublicationOut])
async def get_publications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    type_filter: Optional[str] = Query(None, alias="type"),
    subtype_filter: Optional[str] = Query(None, alias="subtype"),
    tags_filter: Optional[str] = Query(None, alias="tags"),
    db: Session = Depends(get_db)
):
    """
    Obtiene lista de publicaciones con filtros opcionales
    """
    try:
        publications = []
        
        # Construir consulta base según filtros
        if type_filter == "oportunidad_internacional":
            query = db.query(InternationalOpportunity)
        elif type_filter == "evento":
            query = db.query(Event)
        elif type_filter == "proyecto_academico":
            query = db.query(AcademicProject)
        elif type_filter == "anuncio":
            query = db.query(Announcement)
        elif type_filter == "publicacion_simple":
            query = db.query(SimplePost)
        else:
            # Si no hay filtro de tipo, obtener de todas las tablas
            publications = []
            for model in [InternationalOpportunity, Event, AcademicProject, Announcement, SimplePost]:
                model_publications = db.query(model).filter(model.is_active == True).all()
                for pub in model_publications:
                    user = db.query(User).filter(User.id == pub.user_id).first()
                    response_data = {
                        **pub.__dict__,
                        "user_name": user.full_name if user else None
                    }
                    publications.append(PublicationOut(**response_data))
            
            # Aplicar filtros adicionales
            if subtype_filter:
                publications = [p for p in publications if p.subtype == subtype_filter]
            
            if tags_filter:
                tags_list = [tag.strip() for tag in tags_filter.split(",")]
                publications = [
                    p for p in publications 
                    if p.tags and any(tag in p.tags for tag in tags_list)
                ]
            
            # Ordenar por prioridad y fecha
            publications.sort(key=lambda x: (-x.priority, -x.created_at.timestamp()))
            
            return publications[skip:skip+limit]
        
        # Aplicar filtros si hay tipo específico
        query = query.filter(InternationalOpportunity.is_active == True)
        
        if subtype_filter:
            query = query.filter(InternationalOpportunity.subtype == subtype_filter)
        
        if tags_filter:
            tags_list = [tag.strip() for tag in tags_filter.split(",")]
            # Para JSON fields, necesitamos usar contains o similar
            for tag in tags_list:
                query = query.filter(InternationalOpportunity.tags.contains([tag]))
        
        # Ordenar y paginar
        publications = query.order_by(
            InternationalOpportunity.priority.desc(),
            InternationalOpportunity.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        # Preparar respuesta
        result = []
        for pub in publications:
            user = db.query(User).filter(User.id == pub.user_id).first()
            response_data = {
                **pub.__dict__,
                "user_name": user.full_name if user else None
            }
            result.append(PublicationOut(**response_data))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{publication_id}", response_model=PublicationOut)
async def get_publication(publication_id: int, db: Session = Depends(get_db)):
    """
    Obtiene una publicación específica por ID
    """
    try:
        # Buscar en todas las tablas (podríamos optimizar esto)
        for model in [InternationalOpportunity, Event, AcademicProject, Announcement, SimplePost]:
            publication = db.query(model).filter(
                model.id == publication_id,
                model.is_active == True
            ).first()
            
            if publication:
                user = db.query(User).filter(User.id == publication.user_id).first()
                response_data = {
                    **publication.__dict__,
                    "user_name": user.full_name if user else None
                }
                return PublicationOut(**response_data)
        
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{publication_id}", response_model=PublicationOut)
async def update_publication(
    publication_id: int,
    publication_update: PublicationUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza una publicación existente
    """
    try:
        # Buscar la publicación (similar a get)
        for model in [InternationalOpportunity, Event, AcademicProject, Announcement, SimplePost]:
            publication = db.query(model).filter(model.id == publication_id).first()
            
            if publication:
                # Actualizar campos permitidos
                update_data = publication_update.dict(exclude_unset=True)
                for field, value in update_data.items():
                    setattr(publication, field, value)
                
                db.commit()
                db.refresh(publication)
                
                user = db.query(User).filter(User.id == publication.user_id).first()
                response_data = {
                    **publication.__dict__,
                    "user_name": user.full_name if user else None
                }
                return PublicationOut(**response_data)
        
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{publication_id}")
async def delete_publication(publication_id: int, db: Session = Depends(get_db)):
    """
    Elimina (soft delete) una publicación
    """
    try:
        # Buscar la publicación
        for model in [InternationalOpportunity, Event, AcademicProject, Announcement, SimplePost]:
            publication = db.query(model).filter(model.id == publication_id).first()
            
            if publication:
                publication.is_active = False
                db.commit()
                return {"message": "Publicación eliminada correctamente"}
        
        raise HTTPException(status_code=404, detail="Publicación no encontrada")
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
