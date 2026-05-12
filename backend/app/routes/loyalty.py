# backend/app/routes/loyalty.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from decimal import Decimal

from database.connection import get_db
from database.models.point_log import PointLog
from database.models.loyalty_config import LoyaltyConfig
from database.schemas.point_log import PointLogRead
from app.dependencies import get_current_user, get_current_admin
from database.models.user import User

router = APIRouter()

class LoyaltyConfigRead(BaseModel):
    id: int
    earning_rate: Decimal
    description: str | None = None
    is_active: bool

    class Config:
        from_attributes = True

class LoyaltyConfigUpdate(BaseModel):
    earning_rate: Decimal

@router.get("/points/{user_id}", response_model=List[PointLogRead])
def get_user_points(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lịch sử biến động điểm của user"""
    if current_user.id != user_id and current_user.role_id != 3:
        raise HTTPException(status_code=403, detail="Không được phép xem")
    return db.query(PointLog).filter(
        PointLog.user_id == user_id
    ).order_by(PointLog.created_at.desc()).all()

@router.get("/config", response_model=LoyaltyConfigRead)
def get_loyalty_config(db: Session = Depends(get_db)):
    """Lấy cấu hình tích điểm hiện tại"""
    config = db.query(LoyaltyConfig).filter(LoyaltyConfig.is_active == True).first()
    if not config:
        raise HTTPException(status_code=404, detail="Chưa có cấu hình tích điểm")
    return config

@router.put("/config", response_model=LoyaltyConfigRead)
def update_loyalty_config(config_in: LoyaltyConfigUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Admin cập nhật tỷ lệ tích điểm"""
    config = db.query(LoyaltyConfig).filter(LoyaltyConfig.is_active == True).first()
    if not config:
        raise HTTPException(status_code=404, detail="Chưa có cấu hình tích điểm")
    config.earning_rate = config_in.earning_rate
    db.commit()
    db.refresh(config)
    return config


from database.models.member_tier import MemberTier
from database.schemas.member_tier import MemberTierRead

class MemberTierUpdate(BaseModel):
    exp_required: int
    discount_percent: Decimal


@router.get("/tiers", response_model=List[MemberTierRead])
def get_member_tiers(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả các hạng khách hàng"""
    return db.query(MemberTier).order_by(MemberTier.tier_order.asc()).all()


@router.put("/tiers/{tier_id}", response_model=MemberTierRead)
def update_member_tier(tier_id: int, tier_in: MemberTierUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Admin cập nhật điểm cần thiết và % giảm giá của hạng"""
    tier = db.query(MemberTier).filter(MemberTier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Không tìm thấy hạng khách hàng")
    
    tier.exp_required = tier_in.exp_required
    tier.discount_percent = tier_in.discount_percent
    
    db.commit()
    db.refresh(tier)
    return tier

