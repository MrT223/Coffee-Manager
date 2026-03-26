from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class PointLog(Base):
    __tablename__ = "point_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    reward_id = Column(Integer, ForeignKey("rewards.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    point_type_id = Column(Integer, ForeignKey("point_types.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    points_changed = Column(Integer, nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("point_type_id != 1 OR order_id IS NOT NULL", name="chk_pl_earned"),
        CheckConstraint("point_type_id != 2 OR reward_id IS NOT NULL", name="chk_pl_spent"),
    )

    # Relationships
    user = relationship("User", back_populates="point_logs")
    order = relationship("Order", back_populates="point_logs")
    reward = relationship("Reward", back_populates="point_logs")
    point_type = relationship("PointType", back_populates="point_logs")
