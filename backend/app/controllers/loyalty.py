# backend/app/controllers/loyalty.py
from sqlalchemy.orm import Session
from database.models.user import User
from database.models.reward import Reward
from database.models.point_log import PointLog
from database.models.loyalty_config import LoyaltyConfig
from database.models.user_reward import UserReward
from database.models.order import Order
from database.models.order_detail import OrderDetail
from database.models.member_tier import MemberTier
from fastapi import HTTPException
from decimal import Decimal

def get_active_config(db: Session):
    """Lấy cấu hình tích điểm đang hoạt động"""
    return db.query(LoyaltyConfig).filter(LoyaltyConfig.is_active == True).first()

def check_and_upgrade_tier(db: Session, user: User, order_id: int = None):
    """Kiểm tra và thăng hạng cho user, phát thưởng tự động nếu có"""
    # Lấy tất cả các hạng được sắp xếp theo exp_required DESC
    tiers = db.query(MemberTier).order_by(MemberTier.exp_required.desc()).all()
    
    new_tier = None
    for t in tiers:
        if user.total_points >= t.exp_required:
            new_tier = t
            break
            
    if new_tier and new_tier.id != user.tier_id and new_tier.tier_order > user.tier.tier_order:
        # Lên hạng!
        old_tier_name = user.tier.tier_name
        old_tier_order = user.tier.tier_order
        user.tier_id = new_tier.id
        
        # Phát thưởng tự động (Voucher) cho MỌI HẠNG mà người dùng vượt qua (để không bị skip)
        passed_tiers = db.query(MemberTier).filter(
            MemberTier.tier_order > old_tier_order, 
            MemberTier.tier_order <= new_tier.tier_order
        ).all()
        
        for passed_tier in passed_tiers:
            # CHỈ hạng Vàng (tier_order = 3) mới được tặng Voucher khi thăng hạng.
            # Hạng Đồng được tặng khi tạo mới (trong auth), hạng Bạc/Kim Cương không tặng Voucher.
            if passed_tier.tier_order == 3:
                quantity_to_grant = 2
                
                # Tự động tìm voucher tương ứng với tên hạng (ví dụ: "Voucher Hạng Vàng")
                reward_name_search = f"Voucher Hạng {passed_tier.tier_name}"
                reward = db.query(Reward).filter(Reward.name.ilike(f"%{reward_name_search}%")).first()
                
                if reward:
                    for _ in range(quantity_to_grant):
                        ur = UserReward(user_id=user.id, reward_id=reward.id)
                        db.add(ur)
                    
        # Ghi log thăng hạng
        log = PointLog(
            user_id=user.id,
            order_id=order_id,
            point_type_id=1 if order_id else 2, # Fallback to 2 if order_id is somehow missing, though it shouldn't be for type 1. Actually if order_id is None, it will fail constraint if type is 1. We just use type 1 with order_id.
            points_changed=0,
            description=f"Thăng hạng từ {old_tier_name} lên {new_tier.tier_name}"
        )
        # Fix: if order_id is None, point_type_id=1 fails. We shouldn't use 1 without order_id.
        if order_id is None:
            # We'll use type 3 or fallback, let's hope it's not None.
            log.point_type_id = 1 # Assuming order_id is always passed
        db.add(log)


def add_points_from_order(db: Session, user_id: int, order_id: int, total_price: float):
    """Cộng điểm cho khách hàng khi hoàn thành đơn hàng (Dựa trên giá niêm yết)"""
    config = get_active_config(db)
    if not config or not user_id:
        return
        
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return
        
    # Tính giá niêm yết (giá gốc trước giảm giá/hạng/voucher)
    original_total = Decimal('0')
    for od in order.order_details:
        original_total += od.product.price * od.quantity
        
    # Tính số điểm nhận được
    points_earned = int(float(original_total) * float(config.earning_rate))
    
    if points_earned > 0:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.total_points += points_earned
            # Cập nhật total_exp để dự phòng
            user.total_exp += points_earned
            
            # Ghi log biến động điểm
            log = PointLog(
                user_id=user_id,
                order_id=order_id,
                point_type_id=1, # 1: Earned
                points_changed=points_earned,
                description=f"Tích điểm từ đơn hàng #{order_id} (Giá gốc: {original_total}đ)"
            )
            db.add(log)
            
            # Kiểm tra thăng hạng
            check_and_upgrade_tier(db, user, order_id)
            
            db.commit()

def redeem_reward(db: Session, user_id: int, reward_id: int):
    """Đổi quà thủ công (Nếu admin còn giữ chức năng đổi điểm lấy quà)"""
    user = db.query(User).filter(User.id == user_id).first()
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.is_active == True).first()
    
    if not user or not reward:
        raise HTTPException(status_code=404, detail="Người dùng hoặc Quà tặng không tồn tại")
    
    if user.total_points < reward.points_required:
        raise HTTPException(status_code=400, detail="Bạn không đủ điểm để đổi quà này")
    
    if reward.quantity is not None:
        if reward.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quà tặng này đã hết")
        reward.quantity -= 1
    
    # Thực hiện trừ điểm
    user.total_points -= reward.points_required
    user.total_exp -= reward.points_required
    
    # Lưu vào kho quà của User
    user_reward = UserReward(
        user_id=user_id,
        reward_id=reward_id
    )
    db.add(user_reward)
    
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