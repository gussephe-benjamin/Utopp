from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementOut
from app.services.users_service import get_current_user
from app.models.user import User
from app.models.announcement import Announcement
from sqlalchemy.orm import joinedload

router = APIRouter()


@router.get("/", response_model=List[AnnouncementOut])
def get_announcements(
    tags: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all announcements with optional tag filtering"""
    query = db.query(Announcement).options(joinedload(Announcement.created_by))
    
    if tags:
        # Filter by tags - simple implementation
        for tag in tags:
            query = query.filter(Announcement.tags.contains([tag]))
    
    announcements = query.order_by(Announcement.created_at.desc()).all()
    return [AnnouncementOut.model_validate(announcement, from_attributes=True) for announcement in announcements]


@router.get("/{announcement_id}", response_model=AnnouncementOut)
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific announcement by ID"""
    announcement = db.query(Announcement).options(joinedload(Announcement.created_by)).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    return AnnouncementOut.model_validate(announcement, from_attributes=True)


@router.post("/", response_model=AnnouncementOut)
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new announcement"""
    announcement = Announcement(
        title=payload.title,
        content=payload.content,
        tags=payload.tags,
        created_by_id=current_user.id
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    
    # Load the announcement with user data for response
    announcement_with_user = db.query(Announcement).options(joinedload(Announcement.created_by)).filter(Announcement.id == announcement.id).first()
    return AnnouncementOut.model_validate(announcement_with_user, from_attributes=True)


@router.put("/{announcement_id}", response_model=AnnouncementOut)
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing announcement"""
    announcement = db.query(Announcement).options(joinedload(Announcement.created_by)).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Check if user is the creator
    if announcement.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this announcement")
    
    # Update fields
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(announcement, field, value)
    
    db.commit()
    db.refresh(announcement)
    return AnnouncementOut.model_validate(announcement, from_attributes=True)


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an announcement"""
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Check if user is the creator
    if announcement.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this announcement")
    
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}
