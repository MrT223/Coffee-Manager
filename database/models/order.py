from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    total_price = Column(Numeric(12, 2), nullable=False)
    status_id = Column(Integer, ForeignKey("order_statuses.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, default=1)
    order_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("total_price >= 0", name="chk_orders_total_price"),
    )

    # Relationships
    user = relationship("User", back_populates="orders")
    status = relationship("OrderStatus", back_populates="orders")
    order_details = relationship("OrderDetail", back_populates="order", cascade="all, delete-orphan")
    point_logs = relationship("PointLog", back_populates="order")
    user_rewards = relationship("UserReward", back_populates="order")
