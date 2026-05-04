# backend/app/routes/profile.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from database.connection import get_db
from database.models.user import User
from database.models.order import Order
from database.models.order_detail import OrderDetail
from database.models.product import Product
from app.dependencies import get_current_user
from app import security

router = APIRouter()

# Thư mục lưu ảnh upload (dùng chung với product)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Schemas ──────────────────────────────────────────────
class ProfileRead(BaseModel):
    id: int
    username: str
    role_id: int
    total_points: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    avatar_url: Optional[str] = None
    total_orders: int = 0
    total_spent: float = 0.0

    class Config:
        from_attributes = True


class PasswordUpdate(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6, max_length=255)


class OrderDetailItem(BaseModel):
    id: int
    product_id: int
    product_name: str = ""
    product_image: Optional[str] = None
    quantity: int
    price_at_time: Decimal

    class Config:
        from_attributes = True


class OrderHistoryItem(BaseModel):
    id: int
    total_price: Decimal
    status_id: int
    status_name: str = ""
    order_date: datetime
    updated_at: datetime
    items: List[OrderDetailItem] = []

    class Config:
        from_attributes = True


# ── Endpoints ────────────────────────────────────────────
@router.get("/me", response_model=ProfileRead)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy thông tin profile của chính mình"""
    total_orders = db.query(Order).filter(Order.user_id == current_user.id).count()
    total_spent_row = (
        db.query(Order)
        .filter(Order.user_id == current_user.id, Order.status_id == 4)
        .all()
    )
    total_spent = sum(float(o.total_price) for o in total_spent_row)

    return ProfileRead(
        id=current_user.id,
        username=current_user.username,
        role_id=current_user.role_id,
        total_points=current_user.total_points,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        avatar_url=current_user.avatar_url,
        total_orders=total_orders,
        total_spent=total_spent,
    )


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload ảnh đại diện cho khách hàng"""
    # Kiểm tra loại file
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)")
    
    # Giới hạn 2MB cho avatar
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File ảnh không được vượt quá 2MB")
    
    # Tạo tên file duy nhất
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Cập nhật DB
    avatar_url = f"http://127.0.0.1:8000/api/products/uploads/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    
    return {"url": avatar_url}


@router.put("/password")
def change_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Đổi mật khẩu tài khoản"""
    if not security.verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    current_user.password = security.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}


@router.get("/orders", response_model=List[OrderHistoryItem])
def get_my_order_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lịch sử đơn hàng của khách hàng đang đăng nhập"""
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.order_details).joinedload(OrderDetail.product),
            joinedload(Order.status),
        )
        .filter(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
        .all()
    )

    result = []
    for o in orders:
        items = []
        for d in o.order_details:
            items.append(
                OrderDetailItem(
                    id=d.id,
                    product_id=d.product_id,
                    product_name=d.product.name if d.product else "Đã xóa",
                    product_image=d.product.image_url if d.product else None,
                    quantity=d.quantity,
                    price_at_time=d.price_at_time,
                )
            )
        result.append(
            OrderHistoryItem(
                id=o.id,
                total_price=o.total_price,
                status_id=o.status_id,
                status_name=o.status.status_name if o.status else "",
                order_date=o.order_date,
                updated_at=o.updated_at,
                items=items,
            )
        )
    return result
