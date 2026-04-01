# backend/app/routes/product.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from database.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.controllers import product as controller_product
from app.controllers import category as controller_category

router = APIRouter()

@router.get("/", response_model=List[ProductRead])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """API Lấy danh sách sản phẩm"""
    return controller_product.get_products(db, skip=skip, limit=limit)

@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_new_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    category = controller_category.get_category(db, product_in.category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Danh mục không tồn tại")

    return controller_product.create_product(db, product_in)

@router.get("/{product_id}", response_model=ProductRead)
def read_product_detail(product_id: int, db: Session = Depends(get_db)):
    """API Lấy chi tiết sản phẩm"""
    db_product = controller_product.get_product(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    return db_product

@router.put("/{product_id}", response_model=ProductRead)
def update_existing_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    """API Cập nhật sản phẩm"""
    db_product = controller_product.update_product(db, product_id, product_in)
    if not db_product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    return db_product

@router.delete("/{product_id}")
def delete_existing_product(product_id: int, db: Session = Depends(get_db)):
    """API Xóa sản phẩm"""
    success = controller_product.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    return {"message": "Đã xóa sản phẩm thành công"}