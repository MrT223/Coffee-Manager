# backend/app/controllers/loyalty.py
from sqlalchemy.orm import Session
from database.models.user import User
from database.models.reward import Reward
from database.models.point_log import PointLog
from database.models.loyalty_config import LoyaltyConfig
from fastapi import HTTPException

def get_active_config(db: Session):
    """Lấy cấu hình tích điểm đang hoạt động"""
    return db.query(LoyaltyConfig).filter(LoyaltyConfig.is_active == True).first()

def add_points_from_order(db: Session, user_id: int, order_id: int, total_price: float):
    """Cộng điểm cho khách hàng khi hoàn thành đơn hàng (UC-22)"""
    config = get_active_config(db)
    if not config or not user_id:
        return
    
    # Tính số điểm nhận được (Ví dụ: 5% giá trị đơn hàng)
    points_earned = int(float(total_price) * float(config.earning_rate))
    
    if points_earned > 0:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_points += points_earned
            # Ghi log biến động điểm
            log = PointLog(
                user_id=user_id,
                order_id=order_id,
                point_type_id=1, # 1: Earned
                points_changed=points_earned,
                description=f"Tích điểm từ đơn hàng #{order_id}"
            )
            db.add(log)
            db.commit()

def redeem_reward(db: Session, user_id: int, reward_id: int):
    """Đổi quà bằng điểm tích lũy (UC-23)"""
    user = db.query(User).filter(User.id == user_id).first()
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.is_active == True).first()
    
    if not user or not reward:
        raise HTTPException(status_code=404, detail="Người dùng hoặc Quà tặng không tồn tại")
    
    if user.total_points < reward.points_required:
        raise HTTPException(status_code=400, detail="Bạn không đủ điểm để đổi quà này")
    
    # Thực hiện trừ điểm
    user.total_points -= reward.points_required
    
    # Ghi log đổi quà
    log = PointLog(
        user_id=user_id,
        reward_id=reward_id,
        point_type_id=2, # 2: Spent
        points_changed=-reward.points_required,
        description=f"Đổi quà: {reward.name}"
    )
    db.add(log)
    db.commit()
    db.refresh(user)
    return {"message": "Đổi quà thành công", "remaining_points": user.total_points}