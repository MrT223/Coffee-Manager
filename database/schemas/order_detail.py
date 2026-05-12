from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional


class OrderDetailBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderDetailCreate(OrderDetailBase):
    pass


class OrderDetailComboInfo(BaseModel):
    id: int
    name: str
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderDetailRead(OrderDetailBase):
    id: int
    order_id: int
    price_at_time: Decimal
    combo_id: Optional[int] = None
    combo: Optional[OrderDetailComboInfo] = None

    class Config:
        from_attributes = True
