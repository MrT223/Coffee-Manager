from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from database.schemas.order_detail import OrderDetailCreate, OrderDetailRead


class OrderBase(BaseModel):
    user_id: Optional[int] = None
    status_id: int = 1


class OrderCreate(OrderBase):
    items: List[OrderDetailCreate]
    user_reward_id: Optional[int] = None
    channel: str = "ONLINE"
    staff_id: Optional[int] = None


class OrderRead(OrderBase):
    id: int
    total_price: Decimal
    channel: str = "ONLINE"
    staff_id: Optional[int] = None
    staff_username: Optional[str] = None
    order_date: datetime
    updated_at: datetime
    order_details: List[OrderDetailRead] = []

    class Config:
        from_attributes = True


class OrderUpdateStatus(BaseModel):
    status_id: int
