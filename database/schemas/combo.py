from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class ComboItemBase(BaseModel):
    product_id: int
    quantity: int = Field(1, gt=0)


class ComboItemCreate(ComboItemBase):
    pass


class ComboItemRead(ComboItemBase):
    id: int
    product_name: Optional[str] = None
    product_price: Optional[Decimal] = None
    product_image_url: Optional[str] = None

    class Config:
        from_attributes = True


class ComboBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    image_url: Optional[str] = None
    discount_type: str = "FIXED"
    discount_value: Decimal = Field(0, ge=0)
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    time_note: Optional[str] = None


class ComboCreate(ComboBase):
    items: List[ComboItemCreate] = Field(..., min_length=2, max_length=10)


class ComboUpdate(ComboBase):
    items: List[ComboItemCreate] = Field(..., min_length=2, max_length=10)


class ComboRead(ComboBase):
    id: int
    original_price: Decimal = 0  # Giá gốc (tổng giá sản phẩm)
    final_price: Decimal = 0     # Giá sau giảm
    items: List[ComboItemRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
