from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Bcrypt hash
    role_id = Column(Integer, ForeignKey("roles.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, default=1)
    total_points = Column(Integer, nullable=False, default=0)
    birthday = Column(Date, nullable=True)
    last_birthday_wish_year = Column(Integer, nullable=True)
    birthday_locked = Column(Boolean, nullable=False, default=False)
    total_exp = Column(Integer, nullable=False, default=0)
    tier_id = Column(Integer, ForeignKey("member_tiers.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False, default=1)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("total_points >= 0", name="chk_users_total_points"),
        CheckConstraint("total_exp >= 0", name="chk_users_total_exp"),
    )

    # Relationships
    role = relationship("Role", back_populates="users")
    tier = relationship("MemberTier", back_populates="users")
    orders = relationship("Order", foreign_keys="[Order.user_id]", back_populates="user")
    staff_orders = relationship("Order", foreign_keys="[Order.staff_id]", back_populates="staff")
    point_logs = relationship("PointLog", back_populates="user")
    user_rewards = relationship("UserReward", back_populates="user")

