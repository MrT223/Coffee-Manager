from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class LoyaltyConfig(Base):
    __tablename__ = "loyalty_config"

    id = Column(Integer, primary_key=True, index=True)
    earning_rate = Column(Numeric(5, 4), nullable=False, default=0.0500)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        CheckConstraint("earning_rate > 0 AND earning_rate <= 1", name="chk_lc_rate"),
    )

    # Relationships
    updater = relationship("User")
    history = relationship("LoyaltyConfigHistory", back_populates="config")
