from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.user import User
from app.models.follow import Follow
from app.models.saved_event import SavedEvent
from app.models.event_participant import EventParticipant
from app.models.community_post import CommunityPost


def get_profile(db: Session, user_id: int) -> dict:
    user = db.get(User, user_id)
    if not user:
        return {}

    followers_count = db.scalar(select(func.count()).select_from(Follow).where(Follow.following_id == user_id)) or 0
    following_count = db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)) or 0
    posts_count = db.scalar(select(func.count()).select_from(CommunityPost).where(CommunityPost.user_id == user_id)) or 0

    saved_event_ids = [e.event_id for e in db.scalars(select(SavedEvent).where(SavedEvent.user_id == user_id)).all()]
    attending_event_ids = [e.event_id for e in db.scalars(select(EventParticipant).where(EventParticipant.user_id == user_id, EventParticipant.status == "going")).all()]

    return {
        "user": user,
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
        "saved_event_ids": saved_event_ids,
        "attending_event_ids": attending_event_ids,
    }


def follow(db: Session, follower_id: int, following_id: int) -> None:
    exists = db.query(Follow).filter(Follow.follower_id == follower_id, Follow.following_id == following_id).first()
    if not exists:
        db.add(Follow(follower_id=follower_id, following_id=following_id))
        db.commit()


def unfollow(db: Session, follower_id: int, following_id: int) -> None:
    rel = db.query(Follow).filter(Follow.follower_id == follower_id, Follow.following_id == following_id).first()
    if rel:
        db.delete(rel)
        db.commit()


def update_interests(db: Session, user_id: int, interests: List[str]) -> User:
    user = db.get(User, user_id)
    if not user:
        raise ValueError("Usuario no encontrado")
    user.interests = interests
    db.commit()
    db.refresh(user)
    return user
