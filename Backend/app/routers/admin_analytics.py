from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.permissions import require_admin_or_root
from app.models.user import User
from app.schemas.analytics import (
    ActivityTimeseriesPoint,
    AnalyticsSummaryOut,
    AtRiskStudentOut,
    EngagementTimeseriesPoint,
    OrganizationActivityOut,
    StudentsMetricsPageOut,
)
from app.services.analytics import admin_analytics_service as svc

router = APIRouter()


def _parse_range(
    date_from: datetime | None,
    date_to: datetime | None,
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    end = date_to or now
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    start = date_from or (end - timedelta(days=30))
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return start, end


@router.get("/summary", response_model=AnalyticsSummaryOut)
def analytics_summary(
    date_from: datetime | None = Query(None, alias="from"),
    date_to: datetime | None = Query(None, alias="to"),
    organizationId: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    start, end = _parse_range(date_from, date_to)
    data = svc.get_summary(db, date_from=start, date_to=end, organization_id=organizationId)
    return AnalyticsSummaryOut(**data)


@router.get("/activity-timeseries", response_model=list[ActivityTimeseriesPoint])
def analytics_activity_timeseries(
    date_from: datetime | None = Query(None, alias="from"),
    date_to: datetime | None = Query(None, alias="to"),
    groupBy: str = Query("day", pattern="^(day|week|month)$"),
    organizationId: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    start, end = _parse_range(date_from, date_to)
    return svc.get_activity_timeseries(
        db, date_from=start, date_to=end, group_by=groupBy, organization_id=organizationId
    )


@router.get("/engagement-timeseries", response_model=list[EngagementTimeseriesPoint])
def analytics_engagement_timeseries(
    date_from: datetime | None = Query(None, alias="from"),
    date_to: datetime | None = Query(None, alias="to"),
    groupBy: str = Query("day", pattern="^(day|week|month)$"),
    organizationId: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    start, end = _parse_range(date_from, date_to)
    return svc.get_engagement_timeseries(
        db, date_from=start, date_to=end, group_by=groupBy, organization_id=organizationId
    )


@router.get("/organizations", response_model=list[OrganizationActivityOut])
def analytics_organizations(
    date_from: datetime | None = Query(None, alias="from"),
    date_to: datetime | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    start, end = _parse_range(date_from, date_to)
    return svc.get_organizations_activity(db, date_from=start, date_to=end)


@router.get("/students", response_model=StudentsMetricsPageOut)
def analytics_students(
    date_from: datetime | None = Query(None, alias="from"),
    date_to: datetime | None = Query(None, alias="to"),
    organizationId: int | None = None,
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("activityScore"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    start, end = _parse_range(date_from, date_to)
    return svc.get_students_table(
        db,
        date_from=start,
        date_to=end,
        organization_id=organizationId,
        status_filter=status,
        search=search,
        page=page,
        limit=limit,
        sort=sort,
    )


@router.get("/at-risk-students", response_model=list[AtRiskStudentOut])
def analytics_at_risk_students(
    organizationId: int | None = None,
    inactiveDays: int = Query(7, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_root),
):
    return svc.get_at_risk_students(
        db, organization_id=organizationId, inactive_days=inactiveDays
    )
