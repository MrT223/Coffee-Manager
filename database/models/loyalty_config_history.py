from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class LoyaltyConfigHistory(Base):
    __tablename__ = "loyalty_config_history"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("loyalty_config.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    old_earning_rate = Column(Numeric(5, 4), nullable=False)
    new_earning_rate = Column(Numeric(5, 4), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    config = relationship("LoyaltyConfig", back_populates="history")
    user = relationship("User")
