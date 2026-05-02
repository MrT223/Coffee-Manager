from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    total_price = Column(Numeric(12, 2), nullable=False)
    status_id = Column(Integer, ForeignKey("order_statuses.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, default=1)
    channel = Column(String(10), nullable=False, default="ONLINE")
    staff_id = Column(Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    order_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("total_price >= 0", name="chk_orders_total_price"),
        CheckConstraint("channel IN ('ONLINE', 'POS')", name="chk_orders_channel"),
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="orders")
    staff = relationship("User", foreign_keys=[staff_id], back_populates="staff_orders")
    status = relationship("OrderStatus", back_populates="orders")
    order_details = relationship("OrderDetail", back_populates="order", cascade="all, delete-orphan")
    point_logs = relationship("PointLog", back_populates="order")
    user_rewards = relationship("UserReward", back_populates="order")
