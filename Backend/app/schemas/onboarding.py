from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserOnboardingData(BaseModel):
    career: str
    interests: list[str]
    availability: int
    cycle: int
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