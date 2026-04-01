# backend/app/controllers/order.py
from sqlalchemy.orm import Session
from database.models.order import Order
from database.models.order_detail import OrderDetail
from database.models.product import Product
from database.schemas.order import OrderCreate
from app.controllers import product as controller_product
from fastapi import HTTPException
from app.controllers import loyalty as controller_loyalty

def create_order(db: Session, order_in: OrderCreate):
    # 1. Kiểm tra kho và tính tổng tiền thực tế từ DB
    total_price = 0
    items_to_create = []
    
    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_deleted == False).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Sản phẩm ID {item.product_id} không tồn tại")
        
        # Kiểm tra tồn kho (đã bao gồm việc kiểm tra quantity >= item.quantity)
        if product.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Sản phẩm {product.name} đã hết hàng hoặc không đủ số lượng")
        
        item_total = product.price * item.quantity
        total_price += item_total
        
        items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price_at_time": product.price,
            "product_obj": product
        })

    # 2. Tạo Order
    db_order = Order(
        user_id=order_in.user_id,
        total_price=total_price,
        status_id=1  # Chờ xác nhận
    )
    db.add(db_order)
    db.flush()

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
        product.quantity -= item_data["quantity"]
        controller_product.check_and_update_status(product)

    db.commit()
    db.refresh(db_order)

    # 4. Tích điểm
    if db_order.user_id:
        controller_loyalty.add_points_from_order(db, user_id=db_order.user_id, order_id=db_order.id, total_price=db_order.total_price)
        
    return db_order


# --- PHẦN CODE ĐƯỢC BỔ SUNG ĐỂ SỬA LỖI 500 ---
def get_orders(db: Session, skip: int = 0, limit: int = 100):
    """
    Hàm lấy danh sách đơn hàng, sắp xếp theo thời gian mới nhất (hoặc ID giảm dần).
    """
    return db.query(Order).order_by(Order.id.desc()).offset(skip).limit(limit).all()