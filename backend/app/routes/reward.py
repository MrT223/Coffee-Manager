# backend/app/routes/reward.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database.connection import get_db
from database.schemas.reward import RewardCreate, RewardRead
from app.controllers import reward as controller_reward
from app.controllers import loyalty as controller_loyalty

router = APIRouter()

# --- NHÓM ADMIN: QUẢN LÝ CRUD ---

@router.get("/", response_model=List[RewardRead])
def read_rewards(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lấy toàn bộ danh sách quà tặng (Admin)"""
    return controller_reward.get_rewards(db, skip=skip, limit=limit)

@router.post("/", response_model=RewardRead, status_code=status.HTTP_201_CREATED)
def create_new_reward(reward_in: RewardCreate, db: Session = Depends(get_db)):
    """Tạo quà tặng mới"""
    return controller_reward.create_reward(db, reward_in)

@router.put("/{reward_id}", response_model=RewardRead)
def update_existing_reward(reward_id: int, reward_in: RewardCreate, db: Session = Depends(get_db)):
    """Cập nhật quà tặng"""
    db_reward = controller_reward.update_reward(db, reward_id, reward_in)
    if not db_reward:
        raise HTTPException(status_code=404, detail="Không tìm thấy phần thưởng")
    return db_reward

@router.delete("/{reward_id}")
def delete_existing_reward(reward_id: int, db: Session = Depends(get_db)):
    """Xóa quà tặng"""
    success = controller_reward.delete_reward(db, reward_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy phần thưởng")
    return {"message": "Xóa phần thưởng thành công"}

# --- NHÓM USER: ĐỔI QUÀ ---

@router.post("/redeem/{reward_id}")
def redeem_reward_api(reward_id: int, user_id: int, db: Session = Depends(get_db)):
    """API cho khách hàng thực hiện đổi điểm lấy quà"""
    return controller_loyalty.redeem_reward(db, user_id, reward_id)