from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RoleCreate(BaseModel):
    """Schema para crear rol."""
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None


class RoleOut(BaseModel):
    """Schema de salida de rol."""
    id: int
    identifier: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class RoleWithUserOut(RoleOut):
    """Schema de salida de rol enriquecido con el email del usuario al que pertenece."""
    user_email: str


class UserRoleAssign(BaseModel):
    """Schema para asignar rol a usuario."""
    role_id: int


class UserRoleOut(BaseModel):
    """Schema de salida de rol asignado."""
    user_id: int
    user_email: str
    role_id: int
    role_identifier: int
    role_name: str
    assigned_at: datetime
    
    class Config:
        from_attributes = True
