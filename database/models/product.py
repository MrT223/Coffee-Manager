from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    quantity = Column(Integer, nullable=False, default=0) 
    category_id = Column(Integer, ForeignKey("categories.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    image_url = Column(String(500), nullable=True)
    status_id = Column(Integer, ForeignKey("product_statuses.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, default=1)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("price > 0", name="chk_products_price"),
    )

    # Relationships
    category = relationship("Category", back_populates="products")
    status = relationship("ProductStatus", back_populates="products")
    order_details = relationship("OrderDetail", back_populates="product")
