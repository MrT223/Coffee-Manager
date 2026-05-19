# backend/app/crud/user.py
import re
import unicodedata
from sqlalchemy.orm import Session
from database.models.user import User
from database.schemas.user import UserCreate
from app.security import get_password_hash

def get_user_by_username(db: Session, username: str):
    """Tìm người dùng bằng username."""
    return db.query(User).filter(User.username == username).first()

def get_user_by_phone(db: Session, phone: str):
    """Tìm người dùng bằng SĐT (username chính là SĐT)."""
    return db.query(User).filter(User.username == phone).first()


def _remove_vietnamese_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để tạo username ASCII."""
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    # Xử lý ký tự đặc biệt tiếng Việt
    text = text.replace('đ', 'd').replace('Đ', 'D')
    return text


def generate_unique_username(db: Session, full_name: str, phone: str) -> str:
    """
    Tạo username duy nhất theo quy tắc UC-14:
    - Mặc định: Tên (không dấu, viết thường) + 3 số cuối SĐT
    - Nếu trùng: thử 4 số cuối, rồi tăng dần
    - Nếu hết số SĐT mà vẫn trùng: thêm hậu tố số tăng dần
    """
    # Lấy tên (phần cuối cùng của họ tên)
    name_parts = full_name.strip().split()
    first_name = name_parts[-1] if name_parts else "khach"
    
    # Loại bỏ dấu, chuyển thường
    clean_name = _remove_vietnamese_accents(first_name).lower()
    # Chỉ giữ chữ cái và số
    clean_name = re.sub(r'[^a-z0-9]', '', clean_name)
    if not clean_name:
        clean_name = "khach"
    
    # Chỉ lấy phần số từ SĐT
    digits = re.sub(r'\D', '', phone)
    
    # Thử từ 3 số cuối, tăng dần đến hết số SĐT
    for suffix_len in range(3, len(digits) + 1):
        suffix = digits[-suffix_len:]
        candidate = f"{clean_name}{suffix}"
        if not get_user_by_username(db, candidate):
            return candidate
    
    # Nếu vẫn trùng (hết số SĐT), thêm hậu tố counter
    counter = 1
    while True:
        candidate = f"{clean_name}{digits}{counter}"
        if not get_user_by_username(db, candidate):
            return candidate
        counter += 1


def create_user(db: Session, user: UserCreate):
    """Tạo người dùng mới và lưu vào DB."""
    hashed_password = get_password_hash(user.password)
    
    # Tạo User với tổng điểm mặc định là 0
    db_user = User(
        username=user.username,
        password=hashed_password,
        full_name=user.full_name,
        email=user.email,
        role_id=1,
        total_points=0
    )
    
    # Lưu vào database
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Lấy lại dữ liệu mới nhất
    
    return db_user


def create_customer_by_staff(db: Session, phone: str, full_name: str) -> User:
    """
    UC-14: Staff tạo tài khoản cho khách hàng.
    - Mật khẩu mặc định: '123456'
    - Username: Tên + 3 số cuối SĐT (tự động xử lý trùng)
    - Tài khoản tự động active
    """
    # Tạo username duy nhất
    username = generate_unique_username(db, full_name, phone)
    
    # Hash mật khẩu mặc định
    hashed_password = get_password_hash("123456")
    
    db_user = User(
        username=username,
        password=hashed_password,
        full_name=full_name,
        role_id=1,
        total_points=0,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
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