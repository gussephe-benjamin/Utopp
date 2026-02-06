from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.feed import FeedResponse, FeedItem
from app.schemas.event import EventOut
from app.schemas.community import CommunityPostOut
from app.schemas.announcement import AnnouncementOut
from app.services.feed_service import build_feed
from app.services.users_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/feed", response_model=FeedResponse)
def get_feed(
    tipo: Optional[List[str]] = Query(None, description="Tipos: event, community_post, announcement"),
    tags: Optional[List[str]] = Query(None),
    fecha_from: Optional[datetime] = None,
    fecha_to: Optional[datetime] = None,
    order: str = "relevancia",
    page: int = 1,
    size: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = build_feed(
        db,
        current_user,
        tipo=tipo,
        tags=tags,
        fecha_from=fecha_from,
        fecha_to=fecha_to,
        order=order,
        page=page,
        size=size,
    )

    items_out: List[FeedItem] = []
    for it in result["items"]:
        t = it["type"]
        score = float(it["score"]) if it.get("score") is not None else 0.0
        data_obj = it["data"]
        if t == "event":
            data = EventOut.model_validate(data_obj, from_attributes=True).model_dump()
        elif t == "community_post":
            data = CommunityPostOut.model_validate(data_obj, from_attributes=True).model_dump()
        elif t == "announcement":
            data = AnnouncementOut.model_validate(data_obj, from_attributes=True).model_dump()
        else:
            continue
        items_out.append(FeedItem(type=t, score=score, data=data))

    return FeedResponse(page=result["page"], size=result["size"], items=items_out, next_page=result["next_page"])
