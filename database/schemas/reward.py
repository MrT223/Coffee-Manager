from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal


class RewardBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    points_required: int = Field(..., gt=0)
    reward_type_id: int
    discount_value: Optional[Decimal] = Field(None, ge=0)
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = True


class RewardCreate(RewardBase):
    pass


class RewardRead(RewardBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
