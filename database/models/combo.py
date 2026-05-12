from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class Combo(Base):
    __tablename__ = "combos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    discount_type = Column(String(20), nullable=False, default="FIXED")  # 'FIXED' hoặc 'PERCENT'
    discount_value = Column(Numeric(12, 2), nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    time_note = Column(String(500), nullable=True)  # Ghi chú thời gian tự do
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("discount_type IN ('FIXED', 'PERCENT')", name="chk_combos_discount_type"),
        CheckConstraint("discount_value >= 0", name="chk_combos_discount_value"),
    )

    # Relationships
    combo_items = relationship("ComboItem", back_populates="combo", cascade="all, delete-orphan")
