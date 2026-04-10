# backend/app/routes/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from database.connection import get_db
from database.schemas.user import UserRead
from app.controllers import user as controller_user
from app.dependencies import get_current_admin
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
