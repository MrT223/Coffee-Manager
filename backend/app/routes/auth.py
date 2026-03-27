# backend/app/api/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db 
from database.schemas.user import UserCreate, UserRead, UserLogin
from app.controllers import user as controller_user
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """API Đăng ký tài khoản (UC-01)"""
    # 1. Kiểm tra xem username đã tồn tại chưa
    user = controller_user.get_user_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Username đã tồn tại. Vui lòng chọn tên khác."
        )
    
    # 2. Tạo tài khoản mới
    new_user = controller_user.create_user(db=db, user=user_in)
    return new_user

@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """API Đăng nhập (UC-02)"""
    # 1. Tìm người dùng trong DB
    user = controller_user.get_user_by_username(db, username=user_in.username)
    
    # 2. Kiểm tra user có tồn tại không và mật khẩu có đúng không
    if not user or not security.verify_password(user_in.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Sai username hoặc mật khẩu",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Nếu đúng, tạo JWT Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "role_id": user.role_id, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    # Trả về token cho client
    return {"access_token": access_token, "token_type": "bearer"}