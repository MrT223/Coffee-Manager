from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from database.models.user_reward import UserReward
from database.schemas.user_reward import UserRewardRead
from app.dependencies import get_current_user
from database.models.user import User

router = APIRouter()

@router.get("/my-rewards/{user_id}", response_model=List[UserRewardRead])
def get_user_my_rewards(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy danh sách các ưu đãi (chưa dùng) của khách hàng"""
    if current_user.id != user_id and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Không có quyền xem phần thưởng của người khác")
    return db.query(UserReward).filter(
        UserReward.user_id == user_id, 
        UserReward.is_used == False
    ).order_by(UserReward.created_at.desc()).all()
