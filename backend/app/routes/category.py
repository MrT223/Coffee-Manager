# backend/app/routes/category.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from database.schemas.category import CategoryCreate, CategoryRead
from app.controllers import category as controller_category

router = APIRouter()

@router.get("/", response_model=List[CategoryRead])
def read_categories(db: Session = Depends(get_db)):
    """API Lấy danh sách danh mục"""
    return controller_category.get_categories(db)

@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_new_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    """API Tạo danh mục mới (Chỉ Admin/Staff nên làm việc này)"""
    return controller_category.create_category(db, category_in)

@router.put("/{category_id}", response_model=CategoryRead)
def update_existing_category(category_id: int, category_in: CategoryCreate, db: Session = Depends(get_db)):
    """API Cập nhật danh mục"""
    db_category = controller_category.update_category(db, category_id, category_in)
    if not db_category:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục")
    return db_category

@router.delete("/{category_id}")
def delete_existing_category(category_id: int, db: Session = Depends(get_db)):
    """API Xóa danh mục"""
    success = controller_category.delete_category(db, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục hoặc danh mục đang chứa sản phẩm")
    return {"message": "Xóa danh mục thành công"}