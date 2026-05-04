# backend/app/routes/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from database.connection import get_db
from database.schemas.user import UserRead
from app.controllers import user as controller_user
from app.dependencies import get_current_admin, get_current_staff
from database.models.user import User

router = APIRouter()

class RoleUpdate(BaseModel):
    role_id: int

@router.get("/", response_model=List[UserRead])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """API Danh sách users (Admin)"""
    return controller_user.get_users(db, skip=skip, limit=limit)

@router.put("/{user_id}/role", response_model=UserRead)
def update_role(user_id: int, role_in: RoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """API Phân quyền user (Admin)"""
    db_user = controller_user.update_user_role(db, user_id, role_in.role_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return db_user

@router.put("/{user_id}/toggle-active", response_model=UserRead)
def toggle_active(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """API Kích hoạt/vô hiệu hóa tài khoản (Admin)"""
    db_user = controller_user.toggle_user_active(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return db_user

@router.get("/staff-list", response_model=List[UserRead])
def read_staff_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_staff)):
    """API Danh sách nhân viên (Staff/Admin) - Dùng cho bộ lọc POS"""
    return db.query(User).filter(User.role_id.in_([2, 3])).all()

@router.get("/lookup")
def lookup_customer(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_staff)):
    """API Tra cứu khách hàng theo username (Staff/Admin) - Dùng cho POS tích điểm"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    return {"id": user.id, "username": user.username, "total_points": user.total_points, "role_id": user.role_id}
