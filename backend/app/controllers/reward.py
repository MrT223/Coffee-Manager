# backend/app/controllers/reward.py
from sqlalchemy.orm import Session
from database.models.reward import Reward
from database.schemas.reward import RewardCreate

def get_rewards(db: Session, skip: int = 0, limit: int = 100):
    """Lấy danh sách tất cả phần thưởng (cả active và inactive)"""
    return db.query(Reward).offset(skip).limit(limit).all()

def get_reward(db: Session, reward_id: int):
    """Lấy chi tiết một phần thưởng"""
    return db.query(Reward).filter(Reward.id == reward_id).first()

def create_reward(db: Session, reward_in: RewardCreate):
    """Tạo phần thưởng mới (Admin)"""
    db_reward = Reward(**reward_in.model_dump(exclude_unset=True))
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward

def update_reward(db: Session, reward_id: int, reward_in: RewardCreate):
    """Cập nhật thông tin phần thưởng"""
    db_reward = get_reward(db, reward_id)
    if not db_reward:
        return None
    
    for field, value in reward_in.model_dump(exclude_unset=True).items():
        setattr(db_reward, field, value)
    
    db.commit()
    db.refresh(db_reward)
    return db_reward

def delete_reward(db: Session, reward_id: int):
    """Xóa phần thưởng (Hoặc có thể chuyển is_active thành False)"""
    db_reward = get_reward(db, reward_id)
    if db_reward:
        db.delete(db_reward)
        db.commit()
        return True
    return False