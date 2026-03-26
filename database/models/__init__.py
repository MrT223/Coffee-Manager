# Database Models
# Import all models here so Alembic and Base.metadata can discover them

from database.models.role import Role
from database.models.product_status import ProductStatus
from database.models.order_status import OrderStatus
from database.models.reward_type import RewardType
from database.models.point_type import PointType
from database.models.user import User
from database.models.category import Category
from database.models.product import Product
from database.models.order import Order
from database.models.order_detail import OrderDetail
from database.models.reward import Reward
from database.models.point_log import PointLog
from database.models.loyalty_config import LoyaltyConfig
from database.models.loyalty_config_history import LoyaltyConfigHistory
from database.models.audit_log import AuditLog

__all__ = [
    "Role",
    "ProductStatus",
    "OrderStatus",
    "RewardType",
    "PointType",
    "User",
    "Category",
    "Product",
    "Order",
    "OrderDetail",
    "Reward",
    "PointLog",
    "LoyaltyConfig",
    "LoyaltyConfigHistory",
    "AuditLog",
]
