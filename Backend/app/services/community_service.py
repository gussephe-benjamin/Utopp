from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.models.community_post import CommunityPost
from app.models.user import User

def list_posts(db: Session, *, tags: Optional[List[str]] = None) -> List[CommunityPost]:
    q = select(CommunityPost).options(joinedload(CommunityPost.user))
    posts = db.scalars(q).all()
    if tags:
        tags_l = set(map(str.lower, tags))
        posts = [p for p in posts if p.tags and (set(map(str.lower, p.tags)) & tags_l)]
    return posts


def get_post(db: Session, post_id: int) -> Optional[CommunityPost]:
    return db.get(CommunityPost, post_id)


def create_post(db: Session, *, user_id: int, payload: dict) -> CommunityPost:
    post = CommunityPost(user_id=user_id, **payload)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_post(db: Session, *, post: CommunityPost, payload: dict) -> CommunityPost:
    for k, v in payload.items():
        setattr(post, k, v)
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, *, post: CommunityPost) -> None:
    db.delete(post)
    db.commit()
