from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PointLogBase(BaseModel):
    user_id: int
    order_id: Optional[int] = None
    reward_id: Optional[int] = None
    point_type_id: int
    points_changed: int
    description: Optional[str] = None


class PointLogRead(PointLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
