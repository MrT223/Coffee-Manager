# backend/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Lưu ý: Sửa dòng get_db này theo đúng cấu trúc thư mục của bạn (ví dụ: database.database hoặc database.connection)
from database.connection import get_db
from app.controllers import user as crud_user
from app.core import security
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
    
    # Tạo Token
    access_token = security.create_access_token(data={"sub": new_user.username})
    
    # FIX QUAN TRỌNG: Trả về cục "user" chứa chính xác "id"
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role_id": new_user.role_id,
        }
    }

@router.post("/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_username(db, username=req.username)
    
    if not db_user or not security.verify_password(req.password, db_user.password):
        raise HTTPException(status_code=400, detail="Sai tên đăng nhập hoặc mật khẩu")
    
    access_token = security.create_access_token(data={"sub": db_user.username})
    
    # FIX QUAN TRỌNG: Trả về cục "user" chứa chính xác "id" cho Frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "role_id": db_user.role_id,
        }
    }