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