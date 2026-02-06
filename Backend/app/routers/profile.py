from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.profile import ProfileOut, InterestsUpdate
from app.services.profile_service import get_profile as svc_get_profile, follow as svc_follow, unfollow as svc_unfollow, update_interests as svc_update_interests
from app.services.users_service import get_current_user
from app.models.user import User

router = APIRouter()


def _to_profile_out(data: dict) -> ProfileOut:
    user = data.get("user")
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return ProfileOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        interests=user.interests,
        career=user.career,
        cycle=user.cycle,
        availability=user.availability,
        followers_count=data.get("followers_count", 0),
        following_count=data.get("following_count", 0),
        posts_count=data.get("posts_count", 0),
        saved_event_ids=data.get("saved_event_ids", []),
        attending_event_ids=data.get("attending_event_ids", []),
    )


@router.get("/me", response_model=ProfileOut)
def my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = svc_get_profile(db, current_user.id)
    return _to_profile_out(data)


@router.get("/{user_id}", response_model=ProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = svc_get_profile(db, user_id)
    return _to_profile_out(data)


@router.post("/follow/{user_id}")
def follow(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes seguirte a ti mismo")
    svc_follow(db, follower_id=current_user.id, following_id=user_id)
    return {"status": "followed"}


@router.delete("/follow/{user_id}")
def unfollow(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc_unfollow(db, follower_id=current_user.id, following_id=user_id)
    return {"status": "unfollowed"}


@router.put("/interests", response_model=ProfileOut)
def update_interests(payload: InterestsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc_update_interests(db, user_id=current_user.id, interests=payload.interests)
    data = svc_get_profile(db, current_user.id)
    return _to_profile_out(data)
