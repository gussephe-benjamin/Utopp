from pydantic import BaseModel, EmailStr, Field


class UserOnboardingData(BaseModel):
    career: str
    cycle: int = Field(..., ge=1, le=12)

    class Config:
        from_attributes = True


class UserOnboarding_Update(BaseModel):
    is_onboarding_completed: bool

    class Config:
        from_attributes = True


class UserOnboarding_Response(BaseModel):
    email: EmailStr


class OnboardingID(BaseModel):
    id: int


class OnboardingStatusOut(BaseModel):
    user_id: int
    onboarding_completed: bool
