from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from database.schemas.reward import RewardRead

class UserRewardBase(BaseModel):
    user_id: int
    reward_id: int
    is_used: bool = False
    order_id: Optional[int] = None

class UserRewardCreate(UserRewardBase):
    pass

class UserRewardRead(UserRewardBase):
    id: int
    created_at: datetime
    used_at: Optional[datetime] = None
    reward: Optional[RewardRead] = None
    
    class Config:
        from_attributes = True
