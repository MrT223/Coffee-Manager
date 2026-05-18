from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class FeedbackBase(BaseModel):
    category: str = Field(..., max_length=100)
    content: str = Field(..., min_length=10)


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackRead(FeedbackBase):
    id: int
    user_id: int
    created_at: datetime
    
    # Bổ sung thông tin khách hàng để Admin dễ theo dõi
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True
