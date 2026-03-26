from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    role_id: int = 1


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=255)


class UserRead(UserBase):
    id: int
    total_points: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str
