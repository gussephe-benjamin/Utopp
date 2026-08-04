"""Scoring heurístico del feed (Nivel 1) y lectura de personalización (Nivel 2).

Nivel 1: `score_post` calcula un score de relevancia puro por post, a partir de
features normalizadas (0..1) combinadas con pesos estáticos por `post_type`
(`WEIGHT_PROFILES`). No depende de la BD.

Nivel 2: los pesos base se ajustan por usuario dentro de un rango controlado
(`MAX_DESVIACION`), a partir de un delta (`delta_ema`) persistido en
`user_weight_adjustments` (ver `app.models.user_weight_adjustment`). Este
módulo solo lee esos deltas; la escritura vive en `weight_adjustment_service`.

Todas las funciones de esta sección son puras (sin acceso a BD) salvo
`load_weight_adjustments`, que es la única que consulta la sesión de SQLAlchemy.
"""

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Mapping, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.post import PostType
from app.models.user_weight_adjustment import UserWeightAdjustment

# ============================================================
# Constantes Nivel 1 (features)
# ============================================================

RECENCY_HALF_LIFE_HOURS = 48.0
ENGAGEMENT_CAP = 50
URGENCY_WINDOW_DAYS = 14.0

# ============================================================
# Constantes Nivel 2 (personalización)
# ============================================================

ALPHA = 0.15
MIN_EVIDENCE = 5
VALIDITY_WINDOW_DAYS = 30.0
SHRINKAGE_HALF_LIFE_DAYS = 14.0
MAX_DESVIACION = 0.30

TARGET_HIGH_THRESHOLD = 0.5
TARGET_LOW_THRESHOLD = 0.2
TARGET_POSITIVE = 1.0
TARGET_NEGATIVE = -0.5

# Únicos factores que Nivel 2 puede mover. `recency` y `urgency` son
# estructurales/objetivos (frescura y plazo real) y no se personalizan.
ADJUSTABLE_FACTORS: frozenset[str] = frozenset({"interest_overlap", "social_proximity", "engagement"})


# ============================================================
# Perfiles de pesos base por tipo de post (editables a mano)
# ============================================================

WEIGHT_PROFILES: dict[PostType, dict[str, float]] = {
    PostType.event: {
        "interest_overlap": 0.30,
        "social_proximity": 0.15,
        "recency": 0.15,
        "engagement": 0.15,
        "urgency": 0.25,
        "availability_match": 0.0,
    },
    PostType.international_opportunity: {
        "interest_overlap": 0.35,
        "social_proximity": 0.10,
        "recency": 0.10,
        "engagement": 0.10,
        "urgency": 0.35,
        "availability_match": 0.0,
    },
    PostType.academic_project: {
        "interest_overlap": 0.40,
        "social_proximity": 0.20,
        "recency": 0.20,
        "engagement": 0.20,
        "urgency": 0.0,
        "availability_match": 0.0,
    },
    PostType.simple_post: {
        "interest_overlap": 0.35,
        "social_proximity": 0.30,
        "recency": 0.25,
        "engagement": 0.10,
        "urgency": 0.0,
        "availability_match": 0.0,
    },
    PostType.announcement: {
        "interest_overlap": 0.20,
        "social_proximity": 0.10,
        "recency": 0.40,
        "engagement": 0.10,
        "urgency": 0.20,
        "availability_match": 0.0,
    },
}


# ============================================================
# Estructuras de datos (Nivel 1)
# ============================================================

@dataclass(frozen=True)
class PostSignals:
    """Datos de un post necesarios para scorearlo. Duck-typed a propósito:
    en producción se construye desde un `Post` ORM ya cargado (sin queries
    nuevas); en tests se fabrica directamente, sin BD."""

    id: int
    post_type: PostType
    author_id: int
    created_at: datetime
    deadline_at: Optional[datetime] = None
    tags: Sequence[str] = field(default_factory=tuple)
    reaction_count: int = 0
    comment_count: int = 0
    is_pinned: bool = False
    pin_priority: int = 0


@dataclass(frozen=True)
class UserContext:
    """Datos del usuario actual necesarios para personalizar el score."""

    interests: frozenset[str] = frozenset()
    following_ids: frozenset[int] = frozenset()


@dataclass(frozen=True)
class ScoreResult:
    """Resultado de `score_post`: total, desglose por factor y pesos usados."""

    total: float
    breakdown: dict[str, float]
    weights_used: dict[str, float]
    features: dict[str, float]


# ============================================================
# Estructuras de datos (Nivel 2)
# ============================================================

@dataclass(frozen=True)
class WeightAdjustmentState:
    """Estado persistido de un ajuste de peso para (usuario, post_type, factor)."""

    delta_ema: float = 0.0
    evidence_count: int = 0
    last_event_at: Optional[datetime] = None


def _as_aware(dt: datetime) -> datetime:
    """Normaliza un datetime naive a UTC (mismo patrón usado en feed_service)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


# ============================================================
# Features Nivel 1 (cada una normalizada a [0, 1])
# ============================================================

def feature_interest_overlap(tags: Optional[Sequence[str]], interests: frozenset[str]) -> float:
    """Overlap coefficient entre tags del post e intereses del usuario."""
    if not tags:
        return 0.0
    tag_set = frozenset(tags)
    if not tag_set:
        return 0.0
    overlap = len(tag_set & interests)
    return overlap / len(tag_set)


def feature_social_proximity(author_id: int, following_ids: frozenset[int]) -> float:
    """Binario: el usuario sigue al autor del post."""
    return 1.0 if author_id in following_ids else 0.0


def feature_recency(created_at: datetime, now: datetime) -> float:
    """Decaimiento exponencial con media vida de 48 horas."""
    age_hours = max(0.0, (now - _as_aware(created_at)).total_seconds() / 3600.0)
    return math.exp(-math.log(2) * age_hours / RECENCY_HALF_LIFE_HOURS)


def feature_engagement(reaction_count: int, comment_count: int) -> float:
    """Engagement log-normalizado (comentarios pesan el doble que reacciones)."""
    raw = max(0, reaction_count) + 2 * max(0, comment_count)
    value = math.log1p(raw) / math.log1p(ENGAGEMENT_CAP)
    return min(1.0, value)


def feature_urgency(deadline_at: Optional[datetime], now: datetime) -> float:
    """Solo para posts con deadline futuro; 0 si no hay deadline o ya venció."""
    if deadline_at is None:
        return 0.0
    dl = _as_aware(deadline_at)
    if dl <= now:
        return 0.0
    days_left = (dl - now).total_seconds() / 86400.0
    return 1.0 - min(1.0, max(0.0, days_left / URGENCY_WINDOW_DAYS))


def feature_availability_match(*_args, **_kwargs) -> float:
    """Reservada: no existe campo estructurado de fecha/hora de evento en
    `Post` (solo `deadline_at`, que no representa la fecha del evento). Ver
    discrepancia documentada en el plan. Peso 0 en todos los perfiles."""
    return 0.0


def compute_features(post: PostSignals, ctx: UserContext, now: datetime) -> dict[str, float]:
    return {
        "interest_overlap": feature_interest_overlap(post.tags, ctx.interests),
        "social_proximity": feature_social_proximity(post.author_id, ctx.following_ids),
        "recency": feature_recency(post.created_at, now),
        "engagement": feature_engagement(post.reaction_count, post.comment_count),
        "urgency": feature_urgency(post.deadline_at, now),
        "availability_match": feature_availability_match(),
    }


def score_post(
    post: PostSignals,
    ctx: UserContext,
    *,
    now: datetime,
    weight_profile: Optional[Mapping[str, float]] = None,
) -> ScoreResult:
    """Score puro de un post no-pineado. Los pines nunca deben pasar por aquí."""
    profile = weight_profile if weight_profile is not None else WEIGHT_PROFILES[post.post_type]
    features = compute_features(post, ctx, now)
    breakdown = {factor: value * profile.get(factor, 0.0) for factor, value in features.items()}
    total = sum(breakdown.values())
    return ScoreResult(
        total=total,
        breakdown=breakdown,
        weights_used=dict(profile),
        features=features,
    )


def rank_posts(
    posts: Sequence[PostSignals],
    ctx: UserContext,
    *,
    now: datetime,
    weight_profiles: Optional[Mapping[PostType, Mapping[str, float]]] = None,
) -> list[tuple[PostSignals, Optional[ScoreResult]]]:
    """Ordena candidatos: pineados primero (sin scorear), luego el resto por score.

    `weight_profiles`, si se provee, debe ser un mapeo `post_type -> perfil
    efectivo` (ya con Nivel 2 aplicado); si no se provee, usa `WEIGHT_PROFILES`
    base para todos. Función pura, sin acceso a BD.
    """
    pinned = [p for p in posts if p.is_pinned]
    unpinned = [p for p in posts if not p.is_pinned]

    pinned_sorted = sorted(
        pinned,
        key=lambda p: (-p.pin_priority, -p.created_at.timestamp()),
    )

    scored: list[tuple[PostSignals, ScoreResult]] = []
    for post in unpinned:
        profile = weight_profiles.get(post.post_type) if weight_profiles is not None else None
        result = score_post(post, ctx, now=now, weight_profile=profile)
        scored.append((post, result))

    scored.sort(key=lambda pair: (-pair[1].total, -pair[0].created_at.timestamp()))

    return [(p, None) for p in pinned_sorted] + scored


# ============================================================
# Nivel 2 — lectura de deltas
# ============================================================

def compute_target(feature_value: float) -> Optional[float]:
    """Dirección de refuerzo esperada para un factor, dado su feature_value.

    >=0.5 → refuerza (+1); <=0.2 → debilita (-0.5, magnitud menor que el
    refuerzo); zona ambigua (0.2, 0.5) → no se actualiza (None).
    """
    if feature_value >= TARGET_HIGH_THRESHOLD:
        return TARGET_POSITIVE
    if feature_value <= TARGET_LOW_THRESHOLD:
        return TARGET_NEGATIVE
    return None


def effective_delta(state: Optional[WeightAdjustmentState], now: datetime) -> float:
    """Delta que realmente afecta el score: aplica umbral de evidencia,
    ventana de vigencia (corte duro) y shrinkage (decaimiento suave)."""
    if state is None or state.evidence_count < MIN_EVIDENCE or state.last_event_at is None:
        return 0.0

    last_event_at = _as_aware(state.last_event_at)
    days_inactive = (now - last_event_at).total_seconds() / 86400.0

    if days_inactive > VALIDITY_WINDOW_DAYS:
        return 0.0
    if days_inactive <= 0:
        return state.delta_ema

    decay = 0.5 ** (days_inactive / SHRINKAGE_HALF_LIFE_DAYS)
    return state.delta_ema * decay


def effective_weight_profile(
    base_profile: Mapping[str, float],
    adjustments: Mapping[str, WeightAdjustmentState],
    post_type: PostType,
    now: datetime,
) -> dict[str, float]:
    """Aplica los deltas efectivos a `base_profile` con clamp `MAX_DESVIACION`
    y renormaliza para que la suma siga siendo 1.0.

    Si ningún factor tiene delta efectivo distinto de 0 (cold start, o por
    debajo del umbral de evidencia, o fuera de la ventana de vigencia),
    devuelve una copia exacta de `base_profile` sin renormalizar — evita
    introducir error de punto flotante cuando no hay personalización real.
    """
    del post_type  # el aislamiento por post_type ya lo garantiza el caller/esquema
    adjusted = dict(base_profile)
    changed = False

    for factor in ADJUSTABLE_FACTORS:
        base_weight = base_profile.get(factor, 0.0)
        if base_weight <= 0:
            continue
        delta = effective_delta(adjustments.get(factor), now)
        if delta == 0.0:
            continue
        adjusted[factor] = base_weight * (1 + MAX_DESVIACION * delta)
        changed = True

    if not changed:
        return dict(base_profile)

    total = sum(adjusted.values())
    if total <= 0:
        return dict(base_profile)

    return {factor: weight / total for factor, weight in adjusted.items()}


def load_weight_adjustments(
    db: Session, user_id: int
) -> dict[PostType, dict[str, WeightAdjustmentState]]:
    """Batch-load de todos los ajustes de un usuario en una sola query."""
    rows = db.scalars(
        select(UserWeightAdjustment).where(UserWeightAdjustment.user_id == user_id)
    ).all()

    result: dict[PostType, dict[str, WeightAdjustmentState]] = {}
    for row in rows:
        result.setdefault(row.post_type, {})[row.factor] = WeightAdjustmentState(
            delta_ema=row.delta_ema,
            evidence_count=row.evidence_count,
            last_event_at=row.last_event_at,
        )
    return result


def effective_weight_profiles_for_user(
    adjustments_by_type: Mapping[PostType, Mapping[str, WeightAdjustmentState]],
    now: datetime,
) -> dict[PostType, dict[str, float]]:
    """Perfiles efectivos (Nivel 1 + Nivel 2) para todos los post_type, listos
    para pasar a `rank_posts`. Se calcula una sola vez por request de feed."""
    return {
        post_type: effective_weight_profile(
            base_profile, adjustments_by_type.get(post_type, {}), post_type, now
        )
        for post_type, base_profile in WEIGHT_PROFILES.items()
    }
