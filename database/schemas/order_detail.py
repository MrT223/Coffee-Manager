from pydantic import BaseModel, Field
from decimal import Decimal


class OrderDetailBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderDetailCreate(OrderDetailBase):
    pass


class OrderDetailRead(OrderDetailBase):
    id: int
    order_id: int
    price_at_time: Decimal

    class Config:
        from_attributes = True
