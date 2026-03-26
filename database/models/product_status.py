from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class ProductStatus(Base):
    __tablename__ = "product_statuses"

    id = Column(Integer, primary_key=True, index=True)
    status_name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    products = relationship("Product", back_populates="status")
