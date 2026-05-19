from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

from database.schemas.order_detail import OrderDetailCreate, OrderDetailRead


class ComboOrderItem(BaseModel):
    """Item combo trong đơn hàng – frontend gửi combo_id + quantity"""
    combo_id: int
    quantity: int = Field(1, gt=0)


class OrderBase(BaseModel):
    user_id: Optional[int] = None
    status_id: int = 1


class OrderCreate(OrderBase):
    items: List[OrderDetailCreate] = []
    combo_items: List[ComboOrderItem] = []  # Danh sách combo được thêm
    user_reward_id: Optional[int] = None
    channel: str = "ONLINE"
    staff_id: Optional[int] = None
    payment_method: str = "CASH"


class OrderRead(OrderBase):
    id: int
    total_price: Decimal
    channel: str = "ONLINE"
    staff_id: Optional[int] = None
    staff_username: Optional[str] = None
    payment_method: str = "CASH"
    vnp_txn_ref: Optional[str] = None
    vnp_transaction_no: Optional[str] = None
    order_date: datetime
    updated_at: datetime
    order_details: List[OrderDetailRead] = []
    payment_url: Optional[str] = None

    class Config:
        from_attributes = True


class OrderUpdateStatus(BaseModel):
    status_id: int

