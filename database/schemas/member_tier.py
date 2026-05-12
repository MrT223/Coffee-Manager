from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional


class MemberTierBase(BaseModel):
    tier_name: str
    tier_order: int
    exp_required: int
    discount_percent: Decimal
    icon: Optional[str] = None
    color: Optional[str] = None


class MemberTierRead(MemberTierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
