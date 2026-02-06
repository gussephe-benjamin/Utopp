from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.schemas.community import (
    CommunityPostCreate,
    CommunityPostUpdate,
    CommunityPostOut,
)
from app.services.community_service import (
    list_posts as svc_list_posts,
    get_post as svc_get_post,
    create_post as svc_create_post,
    update_post as svc_update_post,
    delete_post as svc_delete_post,
)
from app.services.feed_service import compute_community_post_score
from app.services.users_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/recommended", response_model=List[CommunityPostOut])
def recommended_posts(
    tags: Optional[List[str]] = Query(None),
    page: int = 1,
    size: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = svc_list_posts(db, tags=tags)
    posts_scored = sorted(posts, key=lambda p: compute_community_post_score(db, current_user, p), reverse=True)
    start = max(0, (page - 1) * size)
    end = start + size
    return [CommunityPostOut.model_validate(p, from_attributes=True) for p in posts_scored[start:end]]


@router.get("/posts", response_model=List[CommunityPostOut])
def list_posts(
    tags: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    posts = svc_list_posts(db, tags=tags)
    return [CommunityPostOut.model_validate(p, from_attributes=True) for p in posts]


@router.post("/posts", response_model=CommunityPostOut)
def create_post(payload: CommunityPostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = svc_create_post(db, user_id=current_user.id, payload=payload.model_dump())
    return CommunityPostOut.model_validate(post, from_attributes=True)


@router.get("/posts/{post_id}", response_model=CommunityPostOut)
def get_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = svc_get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    return CommunityPostOut.model_validate(post, from_attributes=True)


@router.put("/posts/{post_id}", response_model=CommunityPostOut)
def update_post(post_id: int, payload: CommunityPostUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = svc_get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    post = svc_update_post(db, post=post, payload=payload.model_dump(exclude_none=True))
    return CommunityPostOut.model_validate(post, from_attributes=True)


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = svc_get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    svc_delete_post(db, post=post)
    return {"status": "deleted"}
