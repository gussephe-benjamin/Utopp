"""Escritura de la personalización Nivel 2: actualiza `user_weight_adjustments`
en respuesta a interacciones calificadas del usuario (like, comentario, guardado,
participación en evento).

No hay infraestructura de colas/workers en el stack. "Asíncrono" aquí significa
únicamente: la escritura ocurre en el endpoint de la interacción (que ya escribe
en BD de todas formas), nunca dentro de `GET /feed`. Ver diagrama del plan.

Todo lo que toca BD (`record_interaction`) es best-effort: si falla, se
registra el error y se hace rollback, pero nunca se propaga hacia el caller —
la interacción principal (el like, el comentario, etc.) ya se completó antes de
llegar aquí y no debe verse afectada por un problema en la personalización.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.event_participant import PostParticipantStatus
from app.models.follow import Follow
from app.models.post import Post
from app.models.post_comment import PostComment
from app.models.post_reaction import PostReaction
from app.models.user import User
from app.models.user_weight_adjustment import UserWeightAdjustment
from app.services import recommendation_service
from app.services.recommendation_service import ADJUSTABLE_FACTORS, ALPHA, UserContext, WeightAdjustmentState

logger = logging.getLogger("utopp.recommendation")

# Fuerza de señal (0-1) por tipo de interacción calificada.
SIGNAL_STRENGTH: dict[str, float] = {
    "liked": 0.3,
    "commented": 0.45,
    "saved": 0.5,
    "interested": 0.4,
    "going": 0.6,
    "attended": 1.0,
}

# Orden de intensidad de los estados de participación, para el guard de
# "solo registrar si el nuevo estado es igual o más fuerte que el anterior".
_PARTICIPATION_STRENGTH_ORDER: dict[PostParticipantStatus, int] = {
    PostParticipantStatus.interested: 0,
    PostParticipantStatus.going: 1,
    PostParticipantStatus.attended: 2,
}


def should_record_participation_change(
    previous: Optional[PostParticipantStatus], new: PostParticipantStatus
) -> bool:
    """True si `new` es un estado igual o más fuerte que `previous` (o si no
    había estado previo). Evita oscilar el delta cuando alguien corrige su
    estado hacia abajo (ej. going -> interested)."""
    if previous is None:
        return True
    return _PARTICIPATION_STRENGTH_ORDER[new] >= _PARTICIPATION_STRENGTH_ORDER[previous]


def apply_event(
    state: WeightAdjustmentState,
    *,
    feature_value: float,
    signal_strength: float,
    now: datetime,
) -> WeightAdjustmentState:
    """Actualiza el estado de un solo factor con la regla de refuerzo (EMA).

    Función pura: no toca BD. Si `feature_value` cae en la zona ambigua
    (`0.2 < feature_value < 0.5`), devuelve el mismo `state` sin modificar
    (identidad preservada — útil para detectar "sin cambios" con `is`).
    """
    target = recommendation_service.compute_target(feature_value)
    if target is None:
        return state

    new_delta = state.delta_ema + ALPHA * signal_strength * (target - state.delta_ema)
    return WeightAdjustmentState(
        delta_ema=new_delta,
        evidence_count=state.evidence_count + 1,
        last_event_at=now,
    )


def _load_following_ids(db: Session, user_id: int) -> frozenset[int]:
    return frozenset(
        db.scalars(select(Follow.following_id).where(Follow.follower_id == user_id)).all()
    )


def record_interaction(
    db: Session,
    *,
    user_id: int,
    post: Post,
    event_type: str,
    following_ids: Optional[frozenset[int]] = None,
    now: Optional[datetime] = None,
) -> None:
    """Punto de entrada usado por los servicios de interacción (reacciones,
    comentarios, guardados, participación) para actualizar los deltas de
    Nivel 2 del usuario para `post.post_type`.

    No lanza excepciones: cualquier error queda contenido y logueado.
    """
    signal_strength = SIGNAL_STRENGTH.get(event_type)
    if signal_strength is None or post is None:
        return

    try:
        now = now or datetime.now(timezone.utc)

        user = db.get(User, user_id)
        if user is None:
            return

        ctx = UserContext(
            interests=frozenset(user.interests or []),
            following_ids=following_ids
            if following_ids is not None
            else _load_following_ids(db, user_id),
        )

        reaction_count = db.scalar(
            select(func.count()).select_from(PostReaction).where(PostReaction.post_id == post.id)
        ) or 0
        comment_count = db.scalar(
            select(func.count()).select_from(PostComment).where(PostComment.post_id == post.id)
        ) or 0

        feature_values: dict[str, float] = {
            "interest_overlap": recommendation_service.feature_interest_overlap(
                post.tags, ctx.interests
            ),
            "social_proximity": recommendation_service.feature_social_proximity(
                post.user_id, ctx.following_ids
            ),
            "engagement": recommendation_service.feature_engagement(reaction_count, comment_count),
        }
        assert set(feature_values.keys()) == ADJUSTABLE_FACTORS

        existing_rows = db.scalars(
            select(UserWeightAdjustment).where(
                UserWeightAdjustment.user_id == user_id,
                UserWeightAdjustment.post_type == post.post_type,
                UserWeightAdjustment.factor.in_(list(feature_values.keys())),
            )
        ).all()
        existing_by_factor = {row.factor: row for row in existing_rows}

        dirty = False
        for factor, feature_value in feature_values.items():
            row = existing_by_factor.get(factor)
            prior_state = WeightAdjustmentState(
                delta_ema=row.delta_ema if row else 0.0,
                evidence_count=row.evidence_count if row else 0,
                last_event_at=row.last_event_at if row else None,
            )
            new_state = apply_event(
                prior_state, feature_value=feature_value, signal_strength=signal_strength, now=now
            )
            if new_state is prior_state:
                continue  # zona ambigua: no hubo actualización para este factor

            dirty = True
            if row is None:
                db.add(
                    UserWeightAdjustment(
                        user_id=user_id,
                        post_type=post.post_type,
                        factor=factor,
                        delta_ema=new_state.delta_ema,
                        evidence_count=new_state.evidence_count,
                        last_event_at=new_state.last_event_at,
                    )
                )
            else:
                row.delta_ema = new_state.delta_ema
                row.evidence_count = new_state.evidence_count
                row.last_event_at = new_state.last_event_at

        if dirty:
            db.commit()
    except Exception:
        logger.exception(
            "No se pudo registrar la interacción de personalización (user_id=%s, post_id=%s, event_type=%s)",
            user_id,
            getattr(post, "id", None),
            event_type,
        )
        db.rollback()
