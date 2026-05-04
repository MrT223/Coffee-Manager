# backend/app/controllers/order.py
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, cast, Date
from database.models.order import Order
from database.models.order_detail import OrderDetail
from database.models.product import Product
from database.schemas.order import OrderCreate
from app.controllers import product as controller_product
from fastapi import HTTPException
from app.controllers import loyalty as controller_loyalty
from database.models.user_reward import UserReward
from database.models.user import User
from decimal import Decimal
from datetime import date, timedelta

def create_order(db: Session, order_in: OrderCreate):
    # 1. Kiểm tra kho và tính tổng tiền thực tế từ DB
    is_staff = False
    if order_in.user_id:
        user = db.query(User).filter(User.id == order_in.user_id).first()
        if user and user.role_id == 2:
            is_staff = True

    total_price = Decimal('0')
    items_to_create = []
    
    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_deleted == False).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Sản phẩm ID {item.product_id} không tồn tại")
        
        # Kiểm tra tồn kho (đã bao gồm việc kiểm tra quantity >= item.quantity)
        if product.quantity is not None and product.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Sản phẩm {product.name} đã hết hàng hoặc không đủ số lượng")
        
        
        calc_price = product.price
        if is_staff:
            calc_price = product.price * Decimal('0.8')

        item_total = calc_price * item.quantity
        total_price += item_total
        
        items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price_at_time": calc_price,
            "product_obj": product
        })

    # 2. Xử lý UserReward (Mã giảm giá/Quà tặng)
    discounted_amount = 0
    db_user_reward = None
    
    if order_in.user_reward_id:
        if not order_in.user_id:
            raise HTTPException(status_code=400, detail="Không thể sử dụng ưu đãi khi chưa đăng nhập")
        
        db_user_reward = db.query(UserReward).filter(
            UserReward.id == order_in.user_reward_id,
            UserReward.user_id == order_in.user_id,
            UserReward.is_used == False
        ).first()
        
        if not db_user_reward:
            raise HTTPException(status_code=404, detail="Ưu đãi không hợp lệ hoặc đã qua sử dụng")
            
        reward = db_user_reward.reward
        
        # Nếu là Mã giảm giá (type=2)
        if reward.reward_type_id == 2 and reward.discount_value:
            discounted_amount = Decimal(str(reward.discount_value))
            total_price = max(total_price - discounted_amount, Decimal('0'))
        # Nếu là Sản phẩm tặng kèm (type=1) -> Không trừ giá tiền mà có thể đưa logic tặng quà vào OrderDetail, nhưng hệ thống hiện chỉ hỗ trợ giá tiền.

    # 3. Tạo Order
    db_order = Order(
        user_id=order_in.user_id,
        total_price=total_price,
        status_id=1,  # Chờ xác nhận
        channel=order_in.channel,
        staff_id=order_in.staff_id
    )
    db.add(db_order)
    db.flush()
    
    # 3.5. Đánh dấu sử dụng ưu đãi
    if db_user_reward:
        db_user_reward.is_used = True
        db_user_reward.order_id = db_order.id
        from sqlalchemy.sql import func
        db_user_reward.used_at = func.now()

    # 3. Tạo OrderDetails và TRỪ KHO CHÍNH THỨC
    for item_data in items_to_create:
        db_detail = OrderDetail(
            order_id=db_order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            price_at_time=item_data["price_at_time"]
        )
        db.add(db_detail)
        
        # Cập nhật số lượng sản phẩm trong kho
        product = item_data["product_obj"]
        if product.quantity is not None:
            product.quantity -= item_data["quantity"]
        controller_product.check_and_update_status(product)

    db.commit()
    db.refresh(db_order)
    
    # Điểm sẽ được tích khi đơn hàng hoàn thành (update_order_status → status_id=4)
    return db_order


# --- PHẦN CODE ĐƯỢC BỔ SUNG ĐỂ SỬA LỖI 500 ---
def get_orders(db: Session, skip: int = 0, limit: int = 100):
    """
    Hàm lấy danh sách đơn hàng, sắp xếp theo thời gian mới nhất (hoặc ID giảm dần).
    """
    return db.query(Order).order_by(Order.id.desc()).offset(skip).limit(limit).all()

def update_order_status(db: Session, order_id: int, status_id: int):
    """Cập nhật trạng thái đơn hàng (UC-11)"""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
    
    old_status = db_order.status_id
    db_order.status_id = status_id
    
    # Nếu đơn hàng bị HỦY (status_id=5) và trước đó chưa bị hủy → HOÀN KHO
    if status_id == 5 and old_status != 5:
        for detail in db_order.order_details:
            product = db.query(Product).filter(Product.id == detail.product_id).first()
            if product and product.quantity is not None:
                product.quantity += detail.quantity
            if product:
                controller_product.check_and_update_status(product)
    
    db.commit()
    db.refresh(db_order)
    
    # Nếu đơn hàng hoàn thành (status_id=4) → tích điểm
    if status_id == 4 and db_order.user_id:
        controller_loyalty.add_points_from_order(
            db, user_id=db_order.user_id,
            order_id=db_order.id,
            total_price=db_order.total_price
        )
    
    return db_order


# ============================================================
# POS – Các hàm phục vụ bán hàng tại quầy
# ============================================================

def get_latest_pos_order(db: Session):
    """
    Lấy đơn POS mới nhất đang ở trạng thái "Chờ xác nhận" (status_id=1).
    Máy A (Customer Display) sẽ polling API này mỗi 3 giây.
    """
    order = db.query(Order).filter(
        Order.channel == "POS",
        Order.status_id == 1
    ).order_by(Order.id.desc()).first()
    return order


def confirm_pos_payment(db: Session, order_id: int):
    """
    Xác nhận thanh toán cho đơn POS → chuyển trạng thái thành "Đã hoàn thành" (status_id=4).
    Đồng thời tích điểm cho khách (nếu có user_id).
    """
    db_order = db.query(Order).filter(Order.id == order_id, Order.channel == "POS").first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng POS")
    
    db_order.status_id = 4  # Đã hoàn thành
    db.commit()
    db.refresh(db_order)
    
    # Tích điểm nếu có user_id
    if db_order.user_id:
        controller_loyalty.add_points_from_order(
            db, user_id=db_order.user_id,
            order_id=db_order.id,
            total_price=db_order.total_price
        )
    
    return db_order


def get_pos_orders(db: Session, staff_id: int = None, date_from: date = None, date_to: date = None, skip: int = 0, limit: int = 100):
    """Lấy danh sách đơn POS (tab Chi tiết đơn hàng)."""
    query = db.query(Order).filter(Order.channel == "POS")
    
    if staff_id:
        query = query.filter(Order.staff_id == staff_id)
    if date_from:
        query = query.filter(cast(Order.order_date, Date) >= date_from)
    if date_to:
        query = query.filter(cast(Order.order_date, Date) <= date_to)
    
    return query.order_by(Order.id.desc()).offset(skip).limit(limit).all()


def get_sales_report(db: Session, staff_id: int = None, channel: str = None, date_from: date = None, date_to: date = None):
    """
    Tạo dữ liệu báo cáo bán hàng cho Tab Báo cáo trên POS.
    Trả về: daily_chart (biểu đồ ngày), top_products, summary (tổng hợp).
    """
    # Base query – chỉ lấy đơn "Đã hoàn thành" (status_id=4)
    base_filter = [Order.status_id == 4]
    
    if staff_id:
        base_filter.append(Order.staff_id == staff_id)
    if channel:
        base_filter.append(Order.channel == channel)
    if date_from:
        base_filter.append(cast(Order.order_date, Date) >= date_from)
    if date_to:
        base_filter.append(cast(Order.order_date, Date) <= date_to)
    
    # 1. Daily chart data (biểu đồ cột + đường)
    daily_data = db.query(
        cast(Order.order_date, Date).label("date"),
        sql_func.count(Order.id).label("order_count"),
        sql_func.sum(Order.total_price).label("revenue")
    ).filter(*base_filter).group_by(
        cast(Order.order_date, Date)
    ).order_by(cast(Order.order_date, Date)).all()
    
    daily_chart = [
        {"date": str(row.date), "order_count": row.order_count, "revenue": float(row.revenue or 0)}
        for row in daily_data
    ]
    
    # 2. Top products (sản phẩm bán chạy)
    top_products_data = db.query(
        Product.name,
        Product.image_url,
        sql_func.sum(OrderDetail.quantity).label("total_sold"),
        sql_func.sum(OrderDetail.quantity * OrderDetail.price_at_time).label("total_revenue")
    ).join(
        OrderDetail, OrderDetail.product_id == Product.id
    ).join(
        Order, Order.id == OrderDetail.order_id
    ).filter(*base_filter).group_by(
        Product.id, Product.name, Product.image_url
    ).order_by(sql_func.sum(OrderDetail.quantity).desc()).limit(10).all()
    
    top_products = [
        {"name": row.name, "image_url": row.image_url, "total_sold": int(row.total_sold), "total_revenue": float(row.total_revenue or 0)}
        for row in top_products_data
    ]
    
    # 3. Summary (tổng hợp)
    summary_data = db.query(
        sql_func.count(Order.id).label("total_orders"),
        sql_func.coalesce(sql_func.sum(Order.total_price), 0).label("total_revenue"),
    ).filter(*base_filter).first()
    
    total_products_sold = db.query(
        sql_func.coalesce(sql_func.sum(OrderDetail.quantity), 0)
    ).join(Order, Order.id == OrderDetail.order_id).filter(*base_filter).scalar()
    
    summary = {
        "total_revenue": float(summary_data.total_revenue),
        "total_orders": summary_data.total_orders,
        "total_products_sold": int(total_products_sold)
    }
    
    return {
        "daily_chart": daily_chart,
        "top_products": top_products,
        "summary": summary
    }