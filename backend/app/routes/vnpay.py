# backend/app/routes/vnpay.py
"""
VNPay Payment Routes – API thanh toán trực tuyến qua VNPay Sandbox.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal

from database.connection import get_db
from database.schemas.order import OrderCreate, OrderRead
from database.models.order import Order
from app.controllers import order as controller_order
from app.dependencies import get_current_user
from database.models.user import User
from app.config import settings
from app.services.vnpay import create_payment_url, verify_vnpay_signature

router = APIRouter()


# ==================== Schemas ====================

class VNPayCreateRequest(BaseModel):
    """Request body cho tạo đơn hàng + thanh toán VNPay"""
    user_id: int
    items: List = []
    combo_items: List = []
    user_reward_id: Optional[int] = None


class VNPayCreateResponse(BaseModel):
    """Response trả về URL thanh toán + thông tin đơn hàng"""
    order_id: int
    payment_url: str
    vnp_txn_ref: str
    total_price: float


class VNPayOrderStatus(BaseModel):
    """Response trạng thái thanh toán đơn hàng"""
    order_id: int
    status_id: int
    status_name: str
    payment_method: str
    vnp_transaction_no: Optional[str] = None
    is_paid: bool


# ==================== API Endpoints ====================

@router.post("/create-payment", response_model=VNPayCreateResponse)
def create_vnpay_payment(
    request_data: VNPayCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo đơn hàng và URL thanh toán VNPay.
    
    Flow:
    1. Tạo đơn hàng với trạng thái "Chờ xác nhận" + payment_method="VNPAY"
    2. Tạo URL thanh toán VNPay từ thông tin đơn hàng
    3. Trả về payment_url để frontend hiển thị QR
    """
    if request_data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không thể đặt hàng thay người khác")
    
    # Tạo OrderCreate từ request data
    order_in = OrderCreate(
        user_id=request_data.user_id,
        items=request_data.items,
        combo_items=request_data.combo_items,
        user_reward_id=request_data.user_reward_id,
        channel="ONLINE",
        payment_method="VNPAY",
    )
    
    # Tạo đơn hàng trong DB
    db_order = controller_order.create_order(db, order_in)
    
    # Lấy IP của client
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    
    # Tạo URL thanh toán VNPay
    order_info = f"Thanh toan don hang Coffee Manager #{db_order.id}"
    
    payment_url, vnp_txn_ref = create_payment_url(
        vnp_payment_url=settings.VNPAY_PAYMENT_URL,
        vnp_tmn_code=settings.VNPAY_TMN_CODE,
        vnp_hash_secret=settings.VNPAY_HASH_SECRET,
        vnp_return_url=settings.VNPAY_RETURN_URL,
        order_id=db_order.id,
        amount=float(db_order.total_price),
        order_info=order_info,
        ip_addr=client_ip,
    )
    
    # Cập nhật vnp_txn_ref vào đơn hàng
    db_order.vnp_txn_ref = vnp_txn_ref
    db.commit()
    db.refresh(db_order)
    
    return VNPayCreateResponse(
        order_id=db_order.id,
        payment_url=payment_url,
        vnp_txn_ref=vnp_txn_ref,
        total_price=float(db_order.total_price),
    )


@router.get("/ipn")
def vnpay_ipn(request: Request, db: Session = Depends(get_db)):
    """
    IPN URL (Instant Payment Notification) – Server-to-Server callback từ VNPay.
    
    VNPay gọi URL này sau khi khách hàng thanh toán thành công/thất bại.
    Endpoint này KHÔNG cần authentication vì VNPay server gọi trực tiếp.
    
    Flow:
    1. Xác thực chữ ký (checksum)
    2. Tìm đơn hàng theo vnp_TxnRef
    3. Kiểm tra số tiền
    4. Cập nhật trạng thái đơn hàng
    5. Trả kết quả cho VNPay
    """
    vnp_params = dict(request.query_params)
    
    if not vnp_params:
        return JSONResponse(content={"RspCode": "99", "Message": "Invalid request"})
    
    # 1. Xác thực chữ ký
    if not verify_vnpay_signature(vnp_params, settings.VNPAY_HASH_SECRET):
        return JSONResponse(content={"RspCode": "97", "Message": "Invalid signature"})
    
    # 2. Tìm đơn hàng
    vnp_txn_ref = vnp_params.get("vnp_TxnRef", "")
    vnp_amount = int(vnp_params.get("vnp_Amount", "0")) // 100  # Chia 100 để lấy giá trị thật
    vnp_response_code = vnp_params.get("vnp_ResponseCode", "")
    vnp_transaction_no = vnp_params.get("vnp_TransactionNo", "")
    vnp_transaction_status = vnp_params.get("vnp_TransactionStatus", "")
    
    db_order = db.query(Order).filter(Order.vnp_txn_ref == vnp_txn_ref).first()
    
    if not db_order:
        return JSONResponse(content={"RspCode": "01", "Message": "Order not found"})
    
    # 3. Kiểm tra số tiền
    order_amount = int(float(db_order.total_price))
    if order_amount != vnp_amount:
        return JSONResponse(content={"RspCode": "04", "Message": "Invalid amount"})
    
    # 4. Kiểm tra trạng thái đơn hàng (chỉ xử lý nếu đơn hàng đang chờ)
    if db_order.status_id != 1:
        return JSONResponse(content={"RspCode": "02", "Message": "Order already confirmed"})
    
    # 5. Cập nhật kết quả thanh toán
    db_order.vnp_transaction_no = vnp_transaction_no
    
    if vnp_response_code == "00" and vnp_transaction_status == "00":
        # Thanh toán thành công → Chuyển sang "Đang chuẩn bị" (status_id=2)
        db_order.status_id = 2
        db.commit()
        db.refresh(db_order)
        return JSONResponse(content={"RspCode": "00", "Message": "Confirm Success"})
    else:
        # Thanh toán thất bại → Hủy đơn
        db_order.status_id = 5
        db.commit()
        db.refresh(db_order)
        return JSONResponse(content={"RspCode": "00", "Message": "Confirm Success"})


@router.get("/payment-status/{order_id}", response_model=VNPayOrderStatus)
def check_payment_status(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Kiểm tra trạng thái thanh toán của đơn hàng.
    Frontend polling API này mỗi 3 giây để cập nhật trạng thái real-time.
    """
    # Tự động quét và hủy các đơn hàng hết hạn trước khi kiểm tra trạng thái
    controller_order.cancel_expired_vnpay_orders(db)
    
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    
    # Chỉ cho phép user xem đơn của mình
    if db_order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền xem đơn hàng này")
    
    status_name = db_order.status.status_name if db_order.status else "Unknown"
    
    # Đơn hàng đã thanh toán khi status_id >= 2 và không phải hủy (5)
    is_paid = db_order.status_id >= 2 and db_order.status_id != 5
    
    return VNPayOrderStatus(
        order_id=db_order.id,
        status_id=db_order.status_id,
        status_name=status_name,
        payment_method=db_order.payment_method,
        vnp_transaction_no=db_order.vnp_transaction_no,
        is_paid=is_paid,
    )


@router.post("/cancel-expired")
def trigger_cancel_expired(db: Session = Depends(get_db)):
    """API thủ công để quét và hủy đơn VNPay hết hạn (quá 15 phút)"""
    canceled_count = controller_order.cancel_expired_vnpay_orders(db)
    return {"message": f"Đã tự động hủy {canceled_count} đơn hàng VNPay hết hạn."}


@router.get("/return")
def vnpay_return(request: Request, db: Session = Depends(get_db)):
    """
    Return URL – VNPay chuyển hướng khách hàng về đây sau khi thanh toán.
    Chỉ dùng để kiểm tra checksum và hiển thị kết quả, KHÔNG cập nhật DB.
    
    Trong thực tế, frontend sẽ handle URL này (React Router).
    Endpoint này chỉ dùng làm fallback/API check.
    """
    vnp_params = dict(request.query_params)
    
    if not vnp_params:
        return JSONResponse(content={"status": "error", "message": "No data"})
    
    is_valid = verify_vnpay_signature(vnp_params, settings.VNPAY_HASH_SECRET)
    vnp_response_code = vnp_params.get("vnp_ResponseCode", "")
    vnp_txn_ref = vnp_params.get("vnp_TxnRef", "")
    
    if is_valid:
        if vnp_response_code == "00":
            return JSONResponse(content={
                "status": "success",
                "message": "Thanh toán thành công",
                "vnp_txn_ref": vnp_txn_ref,
                "response_code": vnp_response_code,
            })
        else:
            return JSONResponse(content={
                "status": "failed",
                "message": "Thanh toán thất bại",
                "vnp_txn_ref": vnp_txn_ref,
                "response_code": vnp_response_code,
            })
    else:
        return JSONResponse(content={
            "status": "error",
            "message": "Chữ ký không hợp lệ",
        })
