from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    points_required = Column(Integer, nullable=False)
    reward_type_id = Column(Integer, ForeignKey("reward_types.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    discount_value = Column(Numeric(12, 2), nullable=True)
    image_url = Column(String(500), nullable=True)
    quantity = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("points_required > 0", name="chk_rewards_points"),
        CheckConstraint("discount_value >= 0", name="chk_rewards_discount"),
    )

    # Relationships
    reward_type = relationship("RewardType", back_populates="rewards")
    point_logs = relationship("PointLog", back_populates="reward")
    user_rewards = relationship("UserReward", back_populates="reward")
