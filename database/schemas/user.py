from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    full_name: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=200)
    birthday: Optional[date] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=255)


from database.schemas.member_tier import MemberTierRead

class UserRead(UserBase):
    id: int
    role_id: int
    total_points: int
    total_exp: int
    tier_id: int
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tier: Optional[MemberTierRead] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str
