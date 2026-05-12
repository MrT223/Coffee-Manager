# backend/app/controllers/combo.py
from sqlalchemy.orm import Session, joinedload
from database.models.combo import Combo
from database.models.combo_item import ComboItem
from database.models.product import Product
from database.schemas.combo import ComboCreate, ComboUpdate, ComboRead, ComboItemRead
from fastapi import HTTPException
from decimal import Decimal


def _calc_combo_prices(combo: Combo, db: Session):
    """Tính giá gốc và giá sau giảm của combo."""
    original_price = Decimal('0')
    items_read = []

    for ci in combo.combo_items:
        product = ci.product
        if product:
            item_price = product.price * ci.quantity
            original_price += item_price
            items_read.append(ComboItemRead(
                id=ci.id,
                product_id=ci.product_id,
                quantity=ci.quantity,
                product_name=product.name,
                product_price=product.price,
                product_image_url=product.image_url,
            ))

    # Tính giá sau giảm
    if combo.discount_type == "FIXED":
        final_price = max(original_price - combo.discount_value, Decimal('0'))
    elif combo.discount_type == "PERCENT":
        discount_amount = original_price * combo.discount_value / Decimal('100')
        final_price = max(original_price - discount_amount, Decimal('0'))
    else:
        final_price = original_price

    # Làm tròn: phần dư >= 500 thì làm tròn lên 1000, ngược lại làm tròn xuống
    remainder = final_price % Decimal('1000')
    if remainder >= Decimal('500'):
        final_price = final_price + (Decimal('1000') - remainder)
    else:
        final_price = final_price - remainder

    return original_price, final_price, items_read


def _combo_to_read(combo: Combo, db: Session) -> dict:
    """Chuyển Combo model thành dict cho ComboRead."""
    original_price, final_price, items_read = _calc_combo_prices(combo, db)
    return {
        "id": combo.id,
        "name": combo.name,
        "description": combo.description,
        "image_url": combo.image_url,
        "discount_type": combo.discount_type,
        "discount_value": combo.discount_value,
        "is_active": combo.is_active,
        "start_date": combo.start_date,
        "end_date": combo.end_date,
        "time_note": combo.time_note,
        "original_price": original_price,
        "final_price": final_price,
        "items": items_read,
        "created_at": combo.created_at,
        "updated_at": combo.updated_at,
    }


def get_combos(db: Session, active_only: bool = False):
    """Lấy danh sách combo, kèm items và tính giá."""
    query = db.query(Combo).options(
        joinedload(Combo.combo_items).joinedload(ComboItem.product)
    )
    if active_only:
        query = query.filter(Combo.is_active == True)
    combos = query.all()
    return [_combo_to_read(c, db) for c in combos]


def get_combo(db: Session, combo_id: int):
    """Lấy chi tiết 1 combo."""
    combo = db.query(Combo).options(
        joinedload(Combo.combo_items).joinedload(ComboItem.product)
    ).filter(Combo.id == combo_id).first()
    if not combo:
        return None
    return _combo_to_read(combo, db)


def create_combo(db: Session, combo_in: ComboCreate):
    """Tạo combo mới (Staff only)."""
    # Validate số lượng sản phẩm
    if len(combo_in.items) < 2:
        raise HTTPException(status_code=400, detail="Combo phải có ít nhất 2 sản phẩm")
    if len(combo_in.items) > 10:
        raise HTTPException(status_code=400, detail="Combo không được quá 10 sản phẩm")

    # Validate sản phẩm đang bán
    for item in combo_in.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_deleted == False
        ).first()
        if not product:
            raise HTTPException(
                status_code=400,
                detail=f"Sản phẩm ID {item.product_id} không tồn tại hoặc đã ngừng bán"
            )

    # Tạo combo
    db_combo = Combo(
        name=combo_in.name,
        description=combo_in.description,
        image_url=combo_in.image_url,
        discount_type=combo_in.discount_type,
        discount_value=combo_in.discount_value,
        is_active=combo_in.is_active,
        start_date=combo_in.start_date,
        end_date=combo_in.end_date,
        time_note=combo_in.time_note,
    )
    db.add(db_combo)
    db.flush()

    # Tạo combo items
    for item in combo_in.items:
        db_item = ComboItem(
            combo_id=db_combo.id,
            product_id=item.product_id,
            quantity=item.quantity,
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_combo)

    # Reload with relationships
    return get_combo(db, db_combo.id)


def update_combo(db: Session, combo_id: int, combo_in: ComboUpdate):
    """Cập nhật combo (Staff only)."""
    db_combo = db.query(Combo).filter(Combo.id == combo_id).first()
    if not db_combo:
        raise HTTPException(status_code=404, detail="Không tìm thấy combo")

    # Validate items
    if len(combo_in.items) < 2:
        raise HTTPException(status_code=400, detail="Combo phải có ít nhất 2 sản phẩm")
    if len(combo_in.items) > 10:
        raise HTTPException(status_code=400, detail="Combo không được quá 10 sản phẩm")

    for item in combo_in.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.is_deleted == False
        ).first()
        if not product:
            raise HTTPException(
                status_code=400,
                detail=f"Sản phẩm ID {item.product_id} không tồn tại hoặc đã ngừng bán"
            )

    # Cập nhật thông tin combo
    db_combo.name = combo_in.name
    db_combo.description = combo_in.description
    db_combo.image_url = combo_in.image_url
    db_combo.discount_type = combo_in.discount_type
    db_combo.discount_value = combo_in.discount_value
    db_combo.is_active = combo_in.is_active
    db_combo.start_date = combo_in.start_date
    db_combo.end_date = combo_in.end_date
    db_combo.time_note = combo_in.time_note

    # Xóa items cũ, tạo items mới
    db.query(ComboItem).filter(ComboItem.combo_id == combo_id).delete()
    for item in combo_in.items:
        db_item = ComboItem(
            combo_id=combo_id,
            product_id=item.product_id,
            quantity=item.quantity,
        )
        db.add(db_item)

    db.commit()
    return get_combo(db, combo_id)


def delete_combo(db: Session, combo_id: int):
    """Xóa combo (Staff only)."""
    db_combo = db.query(Combo).filter(Combo.id == combo_id).first()
    if not db_combo:
        return False
    db.delete(db_combo)
    db.commit()
    return True
