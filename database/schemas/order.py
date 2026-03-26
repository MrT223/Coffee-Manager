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


class OrderRead(OrderBase):
    id: int
    total_price: Decimal
    order_date: datetime
    updated_at: datetime
    order_details: List[OrderDetailRead] = []

    class Config:
        from_attributes = True


class OrderUpdateStatus(BaseModel):
    status_id: int
