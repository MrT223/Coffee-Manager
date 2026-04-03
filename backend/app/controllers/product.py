# app/controllers/product.py
from sqlalchemy.orm import Session
from database.models.product import Product
from database.schemas.product import ProductCreate, ProductUpdate

def check_and_update_status(product: Product):
    """Logic tự động: quantity > 0 -> In stock (1), quantity == 0 -> Out of stock (2)"""
    if product.quantity is None or product.quantity > 0:
        product.status_id = 1
    else:
        product.status_id = 2
    return product

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).filter(Product.is_deleted == False).offset(skip).limit(limit).all()

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()

def create_product(db: Session, product_in: ProductCreate):
    db_product = Product(**product_in.model_dump())
    db_product = check_and_update_status(db_product)
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_in: ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db_product = check_and_update_status(db_product)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if db_product:
        db_product.is_deleted = True
        db.commit()
        return True
    return False