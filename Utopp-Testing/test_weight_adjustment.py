"""Tests unitarios puros del Nivel 2 del algoritmo de recomendación
(personalización de pesos por usuario vía deltas EMA). Igual que
`test_recommendation_score.py`, son pruebas unitarias puras: sin BD real ni
servidor corriendo, a diferencia de la mayoría de `Utopp-Testing`.
"""

import functools
import math
from datetime import datetime, timedelta, timezone

import sys
from pathlib import Path

import pytest

BACKEND_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from app.models.post import PostType  # noqa: E402
from app.services.recommendation_service import (  # noqa: E402
    ALPHA,
    MAX_DESVIACION,
    MIN_EVIDENCE,
    WEIGHT_PROFILES,
    WeightAdjustmentState,
    effective_delta,
    effective_weight_profile,
)
from app.services.weight_adjustment_service import apply_event  # noqa: E402

NOW = datetime(2026, 6, 10, 12, 0, tzinfo=timezone.utc)


def _manual_ema(steps: int, target: float, signal_strength: float) -> float:
    """Aplica la fórmula de EMA manualmente, independiente de `apply_event`,
    para verificar el valor exacto sin depender de la implementación."""
    delta = 0.0
    for _ in range(steps):
        delta = delta + ALPHA * signal_strength * (target - delta)
    return delta


class TestEffectiveWeightProfile:
    def test_no_history_delta_zero_effective_equals_base(self):
        base = WEIGHT_PROFILES[PostType.event]
        result = effective_weight_profile(base, {}, PostType.event, NOW)
        assert result == base

    def test_below_min_evidence_does_not_affect_score(self):
        state = WeightAdjustmentState(
            delta_ema=0.8, evidence_count=MIN_EVIDENCE - 1, last_event_at=NOW
        )
        assert effective_delta(state, NOW) == 0.0

    def test_delta_isolated_per_post_type(self):
        strong_state = WeightAdjustmentState(delta_ema=0.9, evidence_count=20, last_event_at=NOW)
        adjustments_by_type = {PostType.event: {"interest_overlap": strong_state}}

        base_event = WEIGHT_PROFILES[PostType.event]
        base_academic = WEIGHT_PROFILES[PostType.academic_project]

        profile_event = effective_weight_profile(
            base_event, adjustments_by_type.get(PostType.event, {}), PostType.event, NOW
        )
        profile_academic = effective_weight_profile(
            base_academic,
            adjustments_by_type.get(PostType.academic_project, {}),
            PostType.academic_project,
            NOW,
        )

        assert profile_event["interest_overlap"] != base_event["interest_overlap"]
        assert profile_academic == base_academic


class TestApplyEvent:
    def test_above_min_evidence_moves_in_expected_direction(self):
        state = WeightAdjustmentState()
        timestamps = [NOW - timedelta(hours=5 - i) for i in range(6)]  # termina en NOW

        for ts in timestamps:
            state = apply_event(state, feature_value=1.0, signal_strength=1.0, now=ts)

        assert state.evidence_count == 6
        assert state.delta_ema > 0
        assert effective_delta(state, NOW) == state.delta_ema  # sin decaimiento: last_event_at == NOW

        expected = _manual_ema(6, target=1.0, signal_strength=1.0)
        assert math.isclose(state.delta_ema, expected, rel_tol=1e-9)

    def test_single_outlier_event_minimal_impact(self):
        from app.services.recommendation_service import PostSignals, UserContext, score_post

        state = apply_event(WeightAdjustmentState(), feature_value=1.0, signal_strength=1.0, now=NOW)

        assert state.delta_ema == ALPHA
        assert state.evidence_count == 1
        assert MIN_EVIDENCE > 1
        assert effective_delta(state, NOW) == 0.0

        post = PostSignals(
            id=1,
            post_type=PostType.event,
            author_id=42,
            created_at=NOW - timedelta(hours=1),
            tags=("tech",),
        )
        ctx = UserContext(interests=frozenset({"tech"}), following_ids=frozenset())

        profile_with_history = effective_weight_profile(
            WEIGHT_PROFILES[PostType.event], {"interest_overlap": state}, PostType.event, NOW
        )
        score_with_history = score_post(post, ctx, now=NOW, weight_profile=profile_with_history)
        score_without_history = score_post(post, ctx, now=NOW)

        assert score_with_history.total == score_without_history.total
        assert score_with_history.breakdown == score_without_history.breakdown

    def test_extreme_sequence_respects_clamp(self):
        base_weight = WEIGHT_PROFILES[PostType.event]["interest_overlap"]

        state_pos = WeightAdjustmentState()
        for _ in range(200):
            state_pos = apply_event(state_pos, feature_value=1.0, signal_strength=1.0, now=NOW)
        assert state_pos.delta_ema <= 1.0 + 1e-9

        profile_pos = effective_weight_profile(
            WEIGHT_PROFILES[PostType.event], {"interest_overlap": state_pos}, PostType.event, NOW
        )
        assert profile_pos["interest_overlap"] <= base_weight * (1 + MAX_DESVIACION) + 1e-9

        state_neg = WeightAdjustmentState()
        for _ in range(200):
            state_neg = apply_event(state_neg, feature_value=0.0, signal_strength=1.0, now=NOW)
        assert state_neg.delta_ema >= -1.0 - 1e-9

        profile_neg = effective_weight_profile(
            WEIGHT_PROFILES[PostType.event], {"interest_overlap": state_neg}, PostType.event, NOW
        )
        assert profile_neg["interest_overlap"] >= base_weight * (1 - MAX_DESVIACION) - 1e-9

    def test_same_event_sequence_is_deterministic(self):
        eventos = [
            (1.0, 1.0, NOW - timedelta(days=4)),
            (0.0, 0.3, NOW - timedelta(days=3)),
            (1.0, 0.6, NOW - timedelta(days=2)),
            (1.0, 0.45, NOW - timedelta(days=1)),
            (0.0, 0.5, NOW),
        ]

        def reducer(state: WeightAdjustmentState, event: tuple) -> WeightAdjustmentState:
            feature_value, signal_strength, ts = event
            return apply_event(state, feature_value=feature_value, signal_strength=signal_strength, now=ts)

        result1 = functools.reduce(reducer, eventos, WeightAdjustmentState())
        result2 = functools.reduce(reducer, eventos, WeightAdjustmentState())

        assert result1 == result2
        assert result1.delta_ema == result2.delta_ema
        assert result1.evidence_count == result2.evidence_count
        assert result1.last_event_at == result2.last_event_at


class TestEffectiveDeltaTimeDecay:
    def test_interactions_outside_validity_window_ignored(self):
        state = WeightAdjustmentState(
            delta_ema=0.9, evidence_count=10, last_event_at=NOW - timedelta(days=31)
        )
        assert effective_delta(state, NOW) == 0.0

    def test_shrinkage_decays_toward_zero_with_inactivity(self):
        state = WeightAdjustmentState(
            delta_ema=0.8, evidence_count=10, last_event_at=NOW - timedelta(days=14)
        )
        assert effective_delta(state, NOW) == pytest.approx(0.4, rel=1e-6)

        state_28 = WeightAdjustmentState(
            delta_ema=0.8, evidence_count=10, last_event_at=NOW - timedelta(days=28)
        )
        assert effective_delta(state_28, NOW) == pytest.approx(0.2, rel=1e-6)

        state_20 = WeightAdjustmentState(
            delta_ema=0.8, evidence_count=10, last_event_at=NOW - timedelta(days=20)
        )
        state_25 = WeightAdjustmentState(
            delta_ema=0.8, evidence_count=10, last_event_at=NOW - timedelta(days=25)
        )
        assert effective_delta(state_20, NOW) > effective_delta(state_25, NOW)
