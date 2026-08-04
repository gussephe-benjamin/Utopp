from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.user_weight_adjustment import UserWeightAdjustment

# Personalización Nivel 2: eventos de engagement explícito que alimentan
# el delta_ema por (usuario, post_type, factor).
PERSONALIZATION_FACTOR_MAP = {
    "post_liked": "like_rate",
    "post_commented": "comment_rate",
    "post_saved": "save_rate",
}

# Peso de cada nueva señal en el promedio móvil exponencial.
# delta_ema converge hacia 1.0 con engagement sostenido por post_type/factor.
PERSONALIZATION_EMA_ALPHA = 0.2


def apply_personalization_signal(
    db: Session,
    user_id: int,
    event_type: str,
    metadata: dict | None,
) -> None:
    """Actualiza el delta_ema de UserWeightAdjustment a partir de un evento de engagement.

    No hace commit: se ejecuta dentro de la misma transacción que registra el
    ActivityEvent (ver tracking_service.track_activity_event).
    """
    factor = PERSONALIZATION_FACTOR_MAP.get(event_type)
    if factor is None:
        return

    post_id = (metadata or {}).get("post_id")
    if post_id is None:
        return

    post_type = db.scalar(select(Post.post_type).where(Post.id == post_id))
    if post_type is None:
        return

    now = datetime.now(timezone.utc)

    adjustment = db.scalar(
        select(UserWeightAdjustment).where(
            UserWeightAdjustment.user_id == user_id,
            UserWeightAdjustment.post_type == post_type,
            UserWeightAdjustment.factor == factor,
        )
    )
    if adjustment is None:
        adjustment = UserWeightAdjustment(
            user_id=user_id,
            post_type=post_type,
            factor=factor,
            delta_ema=0.0,
            evidence_count=0,
        )
        db.add(adjustment)

    adjustment.delta_ema += PERSONALIZATION_EMA_ALPHA * (1.0 - adjustment.delta_ema)
    adjustment.evidence_count += 1
    adjustment.last_event_at = now


def get_post_type_affinity(db: Session, user_id: int) -> dict:
    """Devuelve, por post_type, la suma de delta_ema del usuario (afinidad Nivel 2)."""
    rows = db.execute(
        select(UserWeightAdjustment.post_type, UserWeightAdjustment.delta_ema).where(
            UserWeightAdjustment.user_id == user_id
        )
    ).all()

    affinity: dict = {}
    for post_type, delta_ema in rows:
        affinity[post_type] = affinity.get(post_type, 0.0) + delta_ema
    return affinity
