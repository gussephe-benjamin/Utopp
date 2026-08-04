"""Tests unitarios puros del Nivel 1 del algoritmo de recomendación (scoring
heurístico por post, sin personalización). A diferencia de la mayoría de
`Utopp-Testing` (que son pruebas de integración contra un servidor vivo),
estos tests importan directamente las funciones puras de
`app.services.recommendation_service` y no dependen de una base de datos
real ni de un servidor corriendo — mismo estilo que `test_activity_score.py`.

Nivel 2 (personalización / deltas por usuario) tiene sus propios tests en
`test_weight_adjustment.py`.
"""

from datetime import datetime, timedelta, timezone

import sys
from pathlib import Path

BACKEND_PATH = Path(__file__).resolve().parents[1] / "Backend"
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

from app.models.post import PostType  # noqa: E402
from app.services.recommendation_service import (  # noqa: E402
    PostSignals,
    UserContext,
    WEIGHT_PROFILES,
    rank_posts,
    score_post,
)

NOW = datetime(2026, 6, 10, 12, 0, tzinfo=timezone.utc)


class TestScorePost:
    def test_same_post_different_users_different_scores(self):
        post = PostSignals(
            id=1,
            post_type=PostType.event,
            author_id=999,
            created_at=NOW,
            deadline_at=None,
            tags=("tech", "academic"),
            reaction_count=0,
            comment_count=0,
        )

        ctx_a = UserContext(interests=frozenset({"tech", "academic"}), following_ids=frozenset())
        ctx_b = UserContext(interests=frozenset({"music"}), following_ids=frozenset())

        result_a = score_post(post, ctx_a, now=NOW)
        result_b = score_post(post, ctx_b, now=NOW)

        assert result_a.total > result_b.total
        assert result_a.breakdown["interest_overlap"] == WEIGHT_PROFILES[PostType.event]["interest_overlap"]
        assert result_b.breakdown["interest_overlap"] == 0.0


class TestRankPosts:
    def test_two_users_different_history_different_order_pins_first(self):
        pin_low = PostSignals(
            id=10,
            post_type=PostType.announcement,
            author_id=500,
            created_at=NOW - timedelta(days=3),
            is_pinned=True,
            pin_priority=2,
        )
        pin_high = PostSignals(
            id=11,
            post_type=PostType.announcement,
            author_id=501,
            created_at=NOW - timedelta(days=1),
            is_pinned=True,
            pin_priority=5,
        )

        post_tech = PostSignals(
            id=1,
            post_type=PostType.event,
            author_id=100,
            created_at=NOW - timedelta(hours=10),
            tags=("tech",),
            reaction_count=0,
            comment_count=0,
        )
        post_music_popular = PostSignals(
            id=2,
            post_type=PostType.event,
            author_id=200,
            created_at=NOW - timedelta(hours=20),
            tags=("music",),
            reaction_count=30,
            comment_count=10,
        )
        post_sports_fresh = PostSignals(
            id=3,
            post_type=PostType.event,
            author_id=300,
            created_at=NOW - timedelta(minutes=30),
            tags=("sports",),
            reaction_count=0,
            comment_count=0,
        )

        posts = [pin_low, pin_high, post_tech, post_music_popular, post_sports_fresh]

        ctx_a = UserContext(interests=frozenset({"tech"}), following_ids=frozenset())
        ctx_b = UserContext(interests=frozenset({"music"}), following_ids=frozenset())

        ranked_a = rank_posts(posts, ctx_a, now=NOW)
        ranked_b = rank_posts(posts, ctx_b, now=NOW)

        ids_a = [sig.id for sig, _ in ranked_a]
        ids_b = [sig.id for sig, _ in ranked_b]

        # Los pineados van primero, en el mismo orden (por pin_priority), para ambos usuarios.
        assert ids_a[:2] == [pin_high.id, pin_low.id]
        assert ids_b[:2] == [pin_high.id, pin_low.id]

        # El resto del orden difiere entre usuarios con intereses distintos.
        assert ids_a[2:] != ids_b[2:]

        # Los ScoreResult solo existen para los no-pineados.
        assert all(result is None for _, result in ranked_a[:2])
        assert all(result is not None for _, result in ranked_a[2:])
