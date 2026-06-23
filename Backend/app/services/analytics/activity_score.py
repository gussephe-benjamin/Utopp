from datetime import datetime, timezone

from app.services.analytics.constants import (
    STATUS_ACTIVO,
    STATUS_BAJO_USO,
    STATUS_INACTIVO,
    STATUS_MUY_ACTIVO,
    STATUS_RIESGO,
    STATUS_USO_MODERADO,
)


def _session_frequency_score(sessions_last_7_days: int) -> float:
    if sessions_last_7_days <= 0:
        return 0.0
    if sessions_last_7_days == 1:
        return 20.0
    if sessions_last_7_days <= 3:
        return 50.0
    if sessions_last_7_days <= 6:
        return 80.0
    return 100.0


def _duration_score(total_duration_seconds_last_7_days: int) -> float:
    minutes = total_duration_seconds_last_7_days / 60
    if minutes <= 0:
        return 0.0
    if minutes <= 5:
        return 25.0
    if minutes <= 15:
        return 50.0
    if minutes <= 45:
        return 80.0
    return 100.0


def _interactions_score(interactions_last_7_days: int) -> float:
    if interactions_last_7_days <= 0:
        return 0.0
    if interactions_last_7_days <= 2:
        return 30.0
    if interactions_last_7_days <= 7:
        return 60.0
    return 100.0


def _recency_score(last_activity_at: datetime | None, now: datetime | None = None) -> float:
    if last_activity_at is None:
        return 0.0
    now = now or datetime.now(timezone.utc)
    if last_activity_at.tzinfo is None:
        last_activity_at = last_activity_at.replace(tzinfo=timezone.utc)
    days = (now - last_activity_at).total_seconds() / 86400
    if days < 1:
        return 100.0
    if days <= 3:
        return 80.0
    if days <= 7:
        return 50.0
    if days <= 14:
        return 20.0
    return 0.0


def calculate_activity_score(
    *,
    sessions_last_7_days: int,
    total_duration_seconds_last_7_days: int,
    interactions_last_7_days: int,
    last_activity_at: datetime | None,
    now: datetime | None = None,
) -> tuple[int, str]:
    """Devuelve (activity_score 0-100, status label)."""
    now = now or datetime.now(timezone.utc)

    freq = _session_frequency_score(sessions_last_7_days)
    duration = _duration_score(total_duration_seconds_last_7_days)
    interactions = _interactions_score(interactions_last_7_days)
    recency = _recency_score(last_activity_at, now)

    score = round(freq * 0.40 + duration * 0.25 + interactions * 0.20 + recency * 0.15)
    score = max(0, min(100, score))

    if last_activity_at is not None:
        if last_activity_at.tzinfo is None:
            last_activity_at = last_activity_at.replace(tzinfo=timezone.utc)
        inactive_days = (now - last_activity_at).total_seconds() / 86400
        if inactive_days > 30:
            return 0, STATUS_INACTIVO

    if score == 0:
        return 0, STATUS_INACTIVO
    if score >= 80:
        return score, STATUS_MUY_ACTIVO
    if score >= 60:
        return score, STATUS_ACTIVO
    if score >= 40:
        return score, STATUS_USO_MODERADO
    if score >= 20:
        return score, STATUS_BAJO_USO
    return score, STATUS_RIESGO
