from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class MemberTier(Base):
    __tablename__ = "member_tiers"

    id = Column(Integer, primary_key=True, index=True)
    tier_name = Column(String(50), nullable=False, unique=True)
    tier_order = Column(Integer, nullable=False, unique=True)
    exp_required = Column(Integer, nullable=False, default=0)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)
    icon = Column(String(10), nullable=True)
    color = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    users = relationship("User", back_populates="tier")
    tier_rewards = relationship("TierReward", back_populates="tier")
