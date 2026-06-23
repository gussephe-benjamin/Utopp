from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.services.analytics.constants import ALLOWED_EVENT_TYPES, MAX_METADATA_BYTES


class TrackEventIn(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=64)
    metadata: Optional[dict[str, Any]] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, value: str) -> str:
        if value not in ALLOWED_EVENT_TYPES:
            raise ValueError(f"event_type no permitido: {value}")
        return value

    @field_validator("metadata")
    @classmethod
    def validate_metadata_size(cls, value: dict | None) -> dict | None:
        if value is None:
            return None
        import json

        if len(json.dumps(value, default=str).encode("utf-8")) > MAX_METADATA_BYTES:
            raise ValueError("metadata demasiado grande")
        return value


class TrackEventOut(BaseModel):
    success: bool = True


class TrendOut(BaseModel):
    percent: float
    direction: Literal["up", "down", "neutral"]


class AnalyticsSummaryOut(BaseModel):
    activeToday: int
    activeLast7Days: int
    activeLast30Days: int
    totalSessions: int
    averageSessionDurationSeconds: float
    sessionsPerActiveStudent: float
    inactiveStudents: int
    postsCreated: int
    commentsCreated: int
    reactionsCreated: int
    totalInteractions: int
    trends: dict[str, TrendOut | None] = Field(default_factory=dict)


class ActivityTimeseriesPoint(BaseModel):
    date: str
    activeStudents: int
    sessions: int
    averageSessionDurationSeconds: float


class EngagementTimeseriesPoint(BaseModel):
    date: str
    postsCreated: int
    commentsCreated: int
    reactionsCreated: int
    totalInteractions: int


class OrganizationActivityOut(BaseModel):
    organizationId: int
    organizationName: str
    activeStudents: int
    totalStudents: int
    activationRate: float
    sessions: int
    averageSessionDurationSeconds: float
    totalInteractions: int


class StudentMetricsOut(BaseModel):
    studentId: int
    name: str
    email: str
    organization: str | None = None
    sessions: int
    totalDurationSeconds: int
    averageSessionDurationSeconds: float
    postsCreated: int
    commentsCreated: int
    reactionsCreated: int
    totalInteractions: int
    lastActivityAt: str | None = None
    status: str
    activityScore: int


class StudentsMetricsPageOut(BaseModel):
    data: list[StudentMetricsOut]
    pagination: dict[str, int]


class AtRiskStudentOut(BaseModel):
    studentId: int
    name: str
    email: str
    organization: str | None = None
    lastActivityAt: str | None = None
    inactiveDays: int | None = None
    previousSessions: int
    riskLevel: str
