# backend/app/controllers/category.py
from sqlalchemy.orm import Session
from database.models.category import Category
from database.schemas.category import CategoryCreate

def get_categories(db: Session):
    """Lấy danh sách tất cả danh mục (UC-04)"""
    return db.query(Category).all()

def get_category(db: Session, category_id: int):
    """Tìm một danh mục theo ID"""
    return db.query(Category).filter(Category.id == category_id).first()

def create_category(db: Session, category: CategoryCreate):
    """Thêm danh mục mới (UC-18)"""
    db_category = Category(category_name=category.category_name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_in: CategoryCreate):
    """Cập nhật danh mục (UC-19)"""
    db_category = get_category(db, category_id)
    if db_category:
        db_category.category_name = category_in.category_name
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    """Xóa danh mục (UC-20)"""
    db_category = get_category(db, category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
        return True
    return False