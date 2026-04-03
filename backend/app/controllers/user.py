# backend/app/crud/user.py
from sqlalchemy.orm import Session
from database.models.user import User
from database.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_user_by_username(db: Session, username: str):
    """Tìm người dùng bằng username."""
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    """Tạo người dùng mới và lưu vào DB."""
    hashed_password = get_password_hash(user.password)
    
    # Tạo User với tổng điểm mặc định là 0
    db_user = User(
        username=user.username,
        password=hashed_password,
        role_id=1,
        total_points=0
    )
    
    # Lưu vào database
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Lấy lại dữ liệu mới nhất
    
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Lấy danh sách tất cả users (Admin)"""
    return db.query(User).offset(skip).limit(limit).all()

def update_user_role(db: Session, user_id: int, role_id: int):
    """Cập nhật vai trò người dùng (Admin)"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    db_user.role_id = role_id
    db.commit()
    db.refresh(db_user)
    return db_user

def toggle_user_active(db: Session, user_id: int):
    """Kích hoạt / vô hiệu hóa tài khoản (Admin)"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    db_user.is_active = not db_user.is_active
    db.commit()
    db.refresh(db_user)
    return db_user