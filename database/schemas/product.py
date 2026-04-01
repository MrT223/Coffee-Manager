from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal


class ProductBase(BaseModel):
    name: str = Field(..., max_length=200)
    price: Decimal = Field(..., gt=0)
    quantity: int = Field(0, ge=0) 
    category_id: int
    image_url: Optional[str] = None
    status_id: int = 1


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    price: Optional[Decimal] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    status_id: Optional[int] = None


class ProductRead(ProductBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
