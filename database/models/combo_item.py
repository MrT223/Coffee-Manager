from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship

from database.connection import Base


class ComboItem(Base):
    __tablename__ = "combo_items"

    id = Column(Integer, primary_key=True, index=True)
    combo_id = Column(Integer, ForeignKey("combos.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_combo_items_qty"),
        UniqueConstraint("combo_id", "product_id", name="uq_combo_product"),
    )

    # Relationships
    combo = relationship("Combo", back_populates="combo_items")
    product = relationship("Product")
