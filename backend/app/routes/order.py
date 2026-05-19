# backend/app/routes/order.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database.connection import get_db
from database.schemas.order import OrderCreate, OrderRead, OrderUpdateStatus
from app.controllers import order as controller_order
from app.dependencies import get_current_user, get_current_staff
from database.models.user import User
from database.models.order import Order

router = APIRouter()

@router.post("/", response_model=OrderRead)
def create_new_order(order_in: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """API Đặt hàng (UC-07) - Tự động trừ kho"""
    if order_in.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không thể đặt hàng thay người khác")
    return controller_order.create_order(db, order_in)

@router.get("/my", response_model=List[OrderRead])
def read_my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """API Lấy đơn hàng của chính người dùng đang đăng nhập"""
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.id.desc()).all()

@router.get("/", response_model=List[OrderRead])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_staff)):
    """API Danh sách đơn hàng (Cho Admin/Staff)"""
    return controller_order.get_orders(db, skip, limit)

@router.put("/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: int, status_in: OrderUpdateStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """API Cập nhật trạng thái đơn hàng (Staff hoặc Customer hủy đơn mình)"""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    # Customer chỉ được hủy đơn của chính mình
    if current_user.role_id == 1:
        if db_order.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Không có quyền thao tác đơn hàng này")
        if status_in.status_id != 5:
            raise HTTPException(status_code=403, detail="Bạn chỉ có thể hủy đơn hàng")
    return controller_order.update_order_status(db, order_id, status_in.status_id)


# ============================================================
# POS – Các API phục vụ bán hàng tại quầy
# ============================================================

@router.post("/pos", response_model=OrderRead)
def create_pos_order(order_in: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_staff)):
    """API Tạo đơn hàng POS (Staff/Admin) - Nhân viên bán hàng tại quầy"""
    order_in.channel = "POS"
    order_in.staff_id = current_user.id
    order = controller_order.create_order(db, order_in)
    
    if order.payment_method == "VNPAY":
        import uuid
        order.vnp_txn_ref = f"POS_{order.id}_{uuid.uuid4().hex[:4]}"
        db.commit()
        db.refresh(order)
        
        order_info = f"Thanh toan don hang Coffee Manager POS #{order.id}"
        from app.services.vnpay import create_payment_url
        from app.config import settings
        
        client_ip = "127.0.0.1"
        bank_code = "NCB" # Default to NCB for POS quick test card
        
        payment_url, _ = create_payment_url(
            vnp_payment_url=settings.VNPAY_PAYMENT_URL,
            vnp_tmn_code=settings.VNPAY_TMN_CODE,
            vnp_hash_secret=settings.VNPAY_HASH_SECRET,
            vnp_return_url=settings.VNPAY_RETURN_URL,
            order_id=order.id,
            amount=float(order.total_price),
            order_info=order_info,
            ip_addr=client_ip,
            vnp_txn_ref=order.vnp_txn_ref,
            bank_code=bank_code,
        )
        
        order_read = OrderRead.from_orm(order)
        order_read.payment_url = payment_url
        return order_read
        
    return order

@router.get("/pos/latest", response_model=Optional[OrderRead])
def get_latest_pos_order(db: Session = Depends(get_db)):
    """API Lấy đơn POS mới nhất đang chờ thanh toán (Máy A polling - KHÔNG CẦN AUTH)"""
    order = controller_order.get_latest_pos_order(db)
    if not order:
        return None
        
    order_read = OrderRead.from_orm(order)
    
    if order.payment_method == "VNPAY":
        # 1. Ensure vnp_txn_ref is present
        if not order.vnp_txn_ref:
            import uuid
            order.vnp_txn_ref = f"POS_{order.id}_{uuid.uuid4().hex[:4]}"
            db.commit()
            db.refresh(order)
            order_read = OrderRead.from_orm(order)
            
        # 2. Generate payment URL
        order_info = f"Thanh toan don hang Coffee Manager POS #{order.id}"
        from app.services.vnpay import create_payment_url
        from app.config import settings
        
        client_ip = "127.0.0.1"
        
        # Check if we have specific bank code or default to NCB for quick test card scanning on POS
        # (This can also be customized by cashier)
        bank_code = "NCB" 
        
        payment_url, _ = create_payment_url(
            vnp_payment_url=settings.VNPAY_PAYMENT_URL,
            vnp_tmn_code=settings.VNPAY_TMN_CODE,
            vnp_hash_secret=settings.VNPAY_HASH_SECRET,
            vnp_return_url=settings.VNPAY_RETURN_URL,
            order_id=order.id,
            amount=float(order.total_price),
            order_info=order_info,
            ip_addr=client_ip,
            vnp_txn_ref=order.vnp_txn_ref,
            bank_code=bank_code,
        )
        order_read.payment_url = payment_url
        
    return order_read

@router.put("/pos/{order_id}/confirm", response_model=OrderRead)
def confirm_pos_payment(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_staff)):
    """API Xác nhận thanh toán đơn POS (Staff)"""
    return controller_order.confirm_pos_payment(db, order_id)

@router.get("/pos/orders", response_model=List[OrderRead])
def read_pos_orders(
    staff_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """API Danh sách đơn POS (Tab Chi tiết đơn hàng)"""
    return controller_order.get_pos_orders(db, staff_id, date_from, date_to, skip, limit)

@router.get("/report")
def get_sales_report(
    staff_id: Optional[int] = None,
    channel: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """API Báo cáo bán hàng (Tab Báo cáo trên POS) - Bộ lọc: Nhân viên, Kênh, Ngày"""
    return controller_order.get_sales_report(db, staff_id, channel, date_from, date_to)