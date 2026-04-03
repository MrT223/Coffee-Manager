# backend/app/routes/product.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil

from database.connection import get_db
from database.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.controllers import product as controller_product
from app.controllers import category as controller_category

router = APIRouter()

# Thư mục lưu ảnh upload
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

# === UPLOAD ẢNH ===
@router.post("/upload-image")
async def upload_product_image(file: UploadFile = File(...)):
    """Upload ảnh sản phẩm, trả về URL"""
    # Kiểm tra loại file
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)")
    
    # Giới hạn 5MB
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File ảnh không được vượt quá 5MB")
    
    # Tạo tên file duy nhất
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Trả về URL tương đối
    return {"url": f"http://127.0.0.1:8000/api/products/uploads/{filename}"}

@router.get("/uploads/{filename}")
def get_uploaded_image(filename: str):
    """Serve ảnh đã upload"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Không tìm thấy ảnh")
    return FileResponse(filepath)