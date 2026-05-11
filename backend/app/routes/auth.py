# backend/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Lưu ý: Sửa dòng get_db này theo đúng cấu trúc thư mục của bạn (ví dụ: database.database hoặc database.connection)
from database.connection import get_db
from app.controllers import user as crud_user
from app import security
from database.schemas.user import UserCreate

router = APIRouter()

# Schema nhận JSON từ Frontend gửi lên
class AuthRequest(BaseModel):
    username: str
    password: str
    fullName: str = None
    role_id: int = 1

@router.post("/register")
def register(req: AuthRequest, db: Session = Depends(get_db)):
    # Kiểm tra trùng lặp
    db_user = crud_user.get_user_by_username(db, username=req.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    
    # Tạo UserCreate schema để phù hợp với hàm crud_user.create_user của bạn
    user_in = UserCreate(username=req.username, password=req.password)
    new_user = crud_user.create_user(db, user=user_in)
    
    # Phát voucher Hạng Đồng khi đăng ký (tier 1)
    from database.models.reward import Reward
    from database.models.user_reward import UserReward
    bronze_reward = db.query(Reward).filter(Reward.name.ilike("%Voucher Hạng Đồng%")).first()
    if bronze_reward:
        ur = UserReward(user_id=new_user.id, reward_id=bronze_reward.id)
        db.add(ur)
        db.commit()
    
    # Tạo Token
    access_token = security.create_access_token(data={"sub": new_user.username})
    
    tier_data = None
    if new_user.tier:
        tier_data = {
            "id": new_user.tier.id,
            "tier_name": new_user.tier.tier_name,
            "tier_order": new_user.tier.tier_order,
            "exp_required": new_user.tier.exp_required,
            "discount_percent": float(new_user.tier.discount_percent),
            "color": new_user.tier.color,
            "icon": new_user.tier.icon
        }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role_id": new_user.role_id,
            "avatar_url": new_user.avatar_url,
            "total_points": new_user.total_points,
            "tier": tier_data
        }
    }

@router.post("/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_username(db, username=req.username)
    
    if not db_user or not security.verify_password(req.password, db_user.password):
        raise HTTPException(status_code=400, detail="Sai tên đăng nhập hoặc mật khẩu")
    
    access_token = security.create_access_token(data={"sub": db_user.username})
    
    tier_data = None
    if db_user.tier:
        tier_data = {
            "id": db_user.tier.id,
            "tier_name": db_user.tier.tier_name,
            "tier_order": db_user.tier.tier_order,
            "exp_required": db_user.tier.exp_required,
            "discount_percent": float(db_user.tier.discount_percent),
            "color": db_user.tier.color,
            "icon": db_user.tier.icon
        }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "role_id": db_user.role_id,
            "avatar_url": db_user.avatar_url,
            "total_points": db_user.total_points,
            "tier": tier_data
        }
    }