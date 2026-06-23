from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import require_terms_accepted
from app.models.user import User
from app.schemas.analytics import TrackEventIn, TrackEventOut
from app.services.analytics.tracking_service import RequestMeta, is_student_user, track_activity_event

router = APIRouter()


def _request_meta(request: Request) -> RequestMeta:
    fwd = request.headers.get("x-forwarded-for")
    ip = (fwd.split(",")[0].strip() if fwd else None) or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
    device_type = None
    browser = None
    if ua:
        ua_lower = ua.lower()
        if "mobile" in ua_lower:
            device_type = "mobile"
        elif "tablet" in ua_lower:
            device_type = "tablet"
        else:
            device_type = "desktop"
        if "chrome" in ua_lower:
            browser = "chrome"
        elif "safari" in ua_lower:
            browser = "safari"
        elif "firefox" in ua_lower:
            browser = "firefox"
    return RequestMeta(ip_address=ip, user_agent=ua, device_type=device_type, browser=browser)


@router.post("/events")
def post_analytics_event(
    payload: TrackEventIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_terms_accepted),
):
    if not is_student_user(current_user, db):
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    try:
        track_activity_event(
            db,
            current_user,
            payload.event_type,
            payload.metadata,
            _request_meta(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return TrackEventOut(success=True)
