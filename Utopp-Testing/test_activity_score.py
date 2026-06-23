from datetime import datetime, timedelta, timezone

import pytest

import sys
from pathlib import Path

BACKEND_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from app.services.analytics.activity_score import calculate_activity_score  # noqa: E402
from app.services.analytics.constants import (  # noqa: E402
    STATUS_ACTIVO,
    STATUS_INACTIVO,
    STATUS_MUY_ACTIVO,
    STATUS_RIESGO,
)


NOW = datetime(2026, 6, 10, 12, 0, tzinfo=timezone.utc)


class TestActivityScore:
    def test_zero_activity_is_inactive(self):
        score, status = calculate_activity_score(
            sessions_last_7_days=0,
            total_duration_seconds_last_7_days=0,
            interactions_last_7_days=0,
            last_activity_at=None,
            now=NOW,
        )
        assert score == 0
        assert status == STATUS_INACTIVO

    def test_high_activity_is_muy_activo(self):
        score, status = calculate_activity_score(
            sessions_last_7_days=7,
            total_duration_seconds_last_7_days=3600,
            interactions_last_7_days=10,
            last_activity_at=NOW - timedelta(hours=2),
            now=NOW,
        )
        assert score >= 80
        assert status == STATUS_MUY_ACTIVO

    def test_moderate_activity(self):
        score, status = calculate_activity_score(
            sessions_last_7_days=3,
            total_duration_seconds_last_7_days=600,
            interactions_last_7_days=4,
            last_activity_at=NOW - timedelta(days=2),
            now=NOW,
        )
        assert 40 <= score < 80
        assert status in {STATUS_ACTIVO, STATUS_MUY_ACTIVO, "Uso moderado"}

    def test_inactive_over_30_days_forces_inactive(self):
        score, status = calculate_activity_score(
            sessions_last_7_days=5,
            total_duration_seconds_last_7_days=1800,
            interactions_last_7_days=5,
            last_activity_at=NOW - timedelta(days=31),
            now=NOW,
        )
        assert score == 0
        assert status == STATUS_INACTIVO

    def test_low_score_is_riesgo(self):
        score, status = calculate_activity_score(
            sessions_last_7_days=1,
            total_duration_seconds_last_7_days=60,
            interactions_last_7_days=0,
            last_activity_at=NOW - timedelta(days=10),
            now=NOW,
        )
        assert score < 40
        assert status in {STATUS_RIESGO, STATUS_INACTIVO, "Bajo uso"}
