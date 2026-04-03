from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from database.models.user_reward import UserReward
from database.schemas.user_reward import UserRewardRead

router = APIRouter()

@router.get("/my-rewards/{user_id}", response_model=List[UserRewardRead])
def get_user_my_rewards(user_id: int, db: Session = Depends(get_db)):
    """Lấy danh sách các ưu đãi (chưa dùng) của khách hàng"""
    return db.query(UserReward).filter(
        UserReward.user_id == user_id, 
        UserReward.is_used == False
    ).order_by(UserReward.created_at.desc()).all()
