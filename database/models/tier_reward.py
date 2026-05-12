from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class TierReward(Base):
    __tablename__ = "tier_rewards"

    id = Column(Integer, primary_key=True, index=True)
    tier_id = Column(Integer, ForeignKey("member_tiers.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    reward_type = Column(String(50), nullable=False)  # 'VOUCHER_S', 'VOUCHER_L', 'PERMANENT_DISCOUNT'
    description = Column(Text, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tier = relationship("MemberTier", back_populates="tier_rewards")
