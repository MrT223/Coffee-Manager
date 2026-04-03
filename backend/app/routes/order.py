# backend/app/routes/order.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from database.schemas.order import OrderCreate, OrderRead, OrderUpdateStatus
from app.controllers import order as controller_order

router = APIRouter()

@router.post("/", response_model=OrderRead)
def create_new_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """API Đặt hàng (UC-07) - Tự động trừ kho"""
    return controller_order.create_order(db, order_in)

@router.get("/", response_model=List[OrderRead])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """API Danh sách đơn hàng (Cho Admin/Staff)"""
    return controller_order.get_orders(db, skip, limit)

@router.put("/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: int, status_in: OrderUpdateStatus, db: Session = Depends(get_db)):
    """API Cập nhật trạng thái đơn hàng (Staff)"""
    return controller_order.update_order_status(db, order_id, status_in.status_id)