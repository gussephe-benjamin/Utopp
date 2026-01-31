from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None
    
    class Config:
        from_attributes = True
        
class UserResponse_total(BaseModel):
    id: int
    email: EmailStr
    full_name: str| None = None
    hashed_password: str
    career: str | None = None
    interests: list[str] | None = []
    availability: int | None = None
    cycle: int | None = None
    is_onboarding_completed: bool
    created_at: datetime
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None

    class Config:
        from_attributes = True    
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

    
