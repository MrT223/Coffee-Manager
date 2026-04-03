from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base

class UserReward(Base):
    __tablename__ = "user_rewards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    is_used = Column(Boolean, nullable=False, default=False)
    order_id = Column(Integer, ForeignKey("orders.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="user_rewards")
    reward = relationship("Reward", back_populates="user_rewards")
    order = relationship("Order", back_populates="user_rewards")
