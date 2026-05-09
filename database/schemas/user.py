from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    birthday: Optional[date] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=255)


class UserRead(UserBase):
    id: int
    total_points: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str
