from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Iterable

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

# Importar nuevos modelos de publicación
from app.models.publication import (
    InternationalOpportunity, Event, AcademicProject,
    Announcement, SimplePost
)
from app.models.user import User
from app.models.follow import Follow
from app.models.user_schedule import UserSchedule


def _interest_score(item_tags: Optional[List[str]], user_interests: Optional[List[str]]) -> float:
    """Calcula el score de interés basado en tags"""
    if not item_tags or not user_interests:
        return 0.0
    inter = len(set(map(str.lower, item_tags)) & set(map(str.lower, user_interests)))
    union = len(set(map(str.lower, item_tags)))
    return inter / union if union else 0.0


def _cycle_score(user_cycle: Optional[int], min_cycle: Optional[int], max_cycle: Optional[int]) -> float:
    """Calcula el score basado en ciclo del usuario"""
    if user_cycle is None:
        return 0.0
    if min_cycle is not None and user_cycle < min_cycle:
        return 0.0
    if max_cycle is not None and user_cycle > max_cycle:
        return 0.0
    return 1.0


def _type_priority_score(publication_type: str) -> float:
    """Asigna prioridad basada en el tipo de publicación"""
    priority_weights = {
        'anuncio': 5.0,           # Máxima prioridad
        'oportunidad_internacional': 4.0,
        'evento': 3.0,
        'proyecto_academico': 2.0,
        'publicacion_simple': 1.0   # Mínima prioridad
    }
    return priority_weights.get(publication_type, 1.0)


def _recency_score(created_at: datetime) -> float:
    """Calcula el score basado en recencia (más reciente = más alto)"""
    now = datetime.now(timezone.utc)
    age_hours = (now - created_at).total_seconds() / 3600
    
    # Decaimiento exponencial: más reciente = más score
    if age_hours < 1:
        return 1.0
    elif age_hours < 24:
        return 0.8
    elif age_hours < 168:  # 1 semana
        return 0.6
    elif age_hours < 720:  # 1 mes
        return 0.4
    else:
        return 0.2


def _social_proximity_score(user_id: int, item_user_id: int, db: Session) -> float:
    """Calcula el score basado en cercanía social"""
    if user_id == item_user_id:
        return 0.5  # Penalizar propio contenido un poco
    
    # Verificar si sigue al autor
    follow = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == item_user_id
    ).first()
    
    if follow:
        return 1.0
    
    return 0.3  # Score base para contenido de otros


def _compute_announcement_score(announcement: Announcement, user_id: int, db: Session) -> float:
    """Calcula score específico para anuncios"""
    base_score = _type_priority_score('anuncio')
    recency_score = _recency_score(announcement.created_at)
    social_score = _social_proximity_score(user_id, announcement.user_id, db)
    
    # Anuncios urgentes tienen más prioridad
    urgency_boost = 1.0
    if announcement.specific_fields:
        urgency = announcement.specific_fields.get('urgency', 'media')
        if urgency == 'alta':
            urgency_boost = 1.5
        elif urgency == 'baja':
            urgency_boost = 0.8
    
    return (base_score * 0.4 + recency_score * 0.3 + 
            social_score * 0.2 + urgency_boost * 0.1)


def _compute_opportunity_score(opportunity: InternationalOpportunity, user_id: int, db: Session) -> float:
    """Calcula score específico para oportunidades internacionales"""
    base_score = _type_priority_score('oportunidad_internacional')
    recency_score = _recency_score(opportunity.created_at)
    social_score = _social_proximity_score(user_id, opportunity.user_id, db)
    
    # Boost según subtipo
    subtype_boosts = {
        'intercambio': 1.2,
        'pasantia': 1.3,
        'investigacion': 1.1,
        '4+1': 1.0
    }
    subtype_boost = subtype_boosts.get(opportunity.subtype, 1.0)
    
    return (base_score * 0.4 + recency_score * 0.3 + 
            social_score * 0.2 + subtype_boost * 0.1)


def _compute_event_score(event: Event, user_id: int, db: Session) -> float:
    """Calcula score específico para eventos"""
    base_score = _type_priority_score('evento')
    recency_score = _recency_score(event.created_at)
    social_score = _social_proximity_score(user_id, event.user_id, db)
    
    # Boost para eventos próximos
    proximity_boost = 1.0
    if event.specific_fields and 'date' in event.specific_fields:
        event_date = event.specific_fields['date']
        if isinstance(event_date, str):
            event_date = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
        
        now = datetime.now(timezone.utc)
        days_until = (event_date - now).days
        
        if days_until <= 7:
            proximity_boost = 1.3
        elif days_until <= 30:
            proximity_boost = 1.1
    
    return (base_score * 0.4 + recency_score * 0.3 + 
            social_score * 0.2 + proximity_boost * 0.1)


def _compute_project_score(project: AcademicProject, user_id: int, db: Session) -> float:
    """Calcula score específico para proyectos académicos"""
    base_score = _type_priority_score('proyecto_academico')
    recency_score = _recency_score(project.created_at)
    social_score = _social_proximity_score(user_id, project.user_id, db)
    
    # Boost según subtipo
    subtype_boosts = {
        'investigacion': 1.2,
        'competencia': 1.1
    }
    subtype_boost = subtype_boosts.get(project.subtype, 1.0)
    
    return (base_score * 0.4 + recency_score * 0.3 + 
            social_score * 0.2 + subtype_boost * 0.1)


def _compute_simple_post_score(post: SimplePost, user_id: int, db: Session) -> float:
    """Calcula score específico para publicaciones simples"""
    base_score = _type_priority_score('publicacion_simple')
    recency_score = _recency_score(post.created_at)
    social_score = _social_proximity_score(user_id, post.user_id, db)
    
    # Boost según tipo de interacción
    mood_boost = 1.0
    if post.specific_fields:
        mood = post.specific_fields.get('mood', 'informativo')
        if mood == 'pregunta':
            mood_boost = 1.2  # Las preguntas generan más interacción
        elif mood == 'debate':
            mood_boost = 1.1
    
    return (base_score * 0.4 + recency_score * 0.3 + 
            social_score * 0.2 + mood_boost * 0.1)


def build_feed(user_id: int, db: Session, page: int = 1, size: int = 10) -> Dict[str, Any]:
    """
    Construye el feed personalizado usando el nuevo sistema de publicaciones
    """
    try:
        offset = (page - 1) * size
        feed_items = []
        
        # Obtener información del usuario
        user = db.query(User).filter(User.id == user_id).first()
        user_interests = user.interests if user and user.interests else []
        user_cycle = user.cycle if user else None
        
        # Obtener publicaciones de cada tipo
        all_items = []
        
        # Oportunidades Internacionales
        opportunities = db.query(InternationalOpportunity).filter(
            InternationalOpportunity.is_active == True
        ).options(selectinload(InternationalOpportunity.user)).all()
        
        for opp in opportunities:
            score = _compute_opportunity_score(opp, user_id, db)
            interest_score = _interest_score(opp.tags, user_interests)
            
            item_data = {
                'id': opp.id,
                'type': 'oportunidad_internacional',
                'subtype': opp.subtype,
                'title': opp.title,
                'content': opp.content,
                'created_at': opp.created_at,
                'user_id': opp.user_id,
                'user_name': opp.user.full_name if opp.user else None,
                'tags': opp.tags,
                'specific_fields': opp.specific_fields,
                'score': score + interest_score * 0.2
            }
            all_items.append(item_data)
        
        # Eventos
        events = db.query(Event).filter(
            Event.is_active == True
        ).options(selectinload(Event.user)).all()
        
        for event in events:
            score = _compute_event_score(event, user_id, db)
            interest_score = _interest_score(event.tags, user_interests)
            
            item_data = {
                'id': event.id,
                'type': 'evento',
                'subtype': event.subtype,
                'title': event.title,
                'content': event.content,
                'created_at': event.created_at,
                'user_id': event.user_id,
                'user_name': event.user.full_name if event.user else None,
                'tags': event.tags,
                'specific_fields': event.specific_fields,
                'score': score + interest_score * 0.2
            }
            all_items.append(item_data)
        
        # Proyectos Académicos
        projects = db.query(AcademicProject).filter(
            AcademicProject.is_active == True
        ).options(selectinload(AcademicProject.user)).all()
        
        for project in projects:
            score = _compute_project_score(project, user_id, db)
            interest_score = _interest_score(project.tags, user_interests)
            
            item_data = {
                'id': project.id,
                'type': 'proyecto_academico',
                'subtype': project.subtype,
                'title': project.title,
                'content': project.content,
                'created_at': project.created_at,
                'user_id': project.user_id,
                'user_name': project.user.full_name if project.user else None,
                'tags': project.tags,
                'specific_fields': project.specific_fields,
                'score': score + interest_score * 0.2
            }
            all_items.append(item_data)
        
        # Anuncios
        announcements = db.query(Announcement).filter(
            Announcement.is_active == True
        ).options(selectinload(Announcement.user)).all()
        
        for announcement in announcements:
            score = _compute_announcement_score(announcement, user_id, db)
            interest_score = _interest_score(announcement.tags, user_interests)
            
            item_data = {
                'id': announcement.id,
                'type': 'anuncio',
                'subtype': announcement.subtype,
                'title': announcement.title,
                'content': announcement.content,
                'created_at': announcement.created_at,
                'user_id': announcement.user_id,
                'user_name': announcement.user.full_name if announcement.user else None,
                'tags': announcement.tags,
                'specific_fields': announcement.specific_fields,
                'score': score + interest_score * 0.2
            }
            all_items.append(item_data)
        
        # Publicaciones Simples
        simple_posts = db.query(SimplePost).filter(
            SimplePost.is_active == True
        ).options(selectinload(SimplePost.user)).all()
        
        for post in simple_posts:
            score = _compute_simple_post_score(post, user_id, db)
            interest_score = _interest_score(post.tags, user_interests)
            
            item_data = {
                'id': post.id,
                'type': 'publicacion_simple',
                'subtype': post.subtype,
                'title': post.title,
                'content': post.content,
                'created_at': post.created_at,
                'user_id': post.user_id,
                'user_name': post.user.full_name if post.user else None,
                'tags': post.tags,
                'specific_fields': post.specific_fields,
                'score': score + interest_score * 0.2
            }
            all_items.append(item_data)
        
        # Ordenar por score (descendente) y luego por fecha (reciente primero)
        all_items.sort(key=lambda x: (-x['score'], -x['created_at'].timestamp()))
        
        # Aplicar paginación
        total_items = len(all_items)
        paginated_items = all_items[offset:offset + size]
        
        return {
            'items': paginated_items,
            'total': total_items,
            'page': page,
            'size': size,
            'has_more': offset + size < total_items
        }
        
    except Exception as e:
        print(f"Error en build_feed: {str(e)}")
        return {
            'items': [],
            'total': 0,
            'page': page,
            'size': size,
            'has_more': False
        }
