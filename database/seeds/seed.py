"""
Seed data – Chèn dữ liệu khởi tạo cho các bảng lookup.
Chạy:  python -m database.seeds.seed
"""
from sqlalchemy.orm import Session

from database.connection import SessionLocal, engine, Base
from database.models import (
    Role, ProductStatus, OrderStatus,
    RewardType, PointType, LoyaltyConfig, MemberTier,
    User, Category, Product
)
from app.security import get_password_hash


# ---------- Lookup Data ----------

ROLES = [
    {"role_name": "Customer", "description": "Khách hàng – đặt hàng, tích điểm, đổi quà"},
    {"role_name": "Staff",    "description": "Nhân viên – xử lý đơn hàng, quản lý sản phẩm cơ bản"},
    {"role_name": "Admin",    "description": "Quản trị viên – toàn quyền quản lý hệ thống"},
]

PRODUCT_STATUSES = [
    {"status_name": "In stock",     "description": "Sản phẩm đang có sẵn"},
    {"status_name": "Out of stock", "description": "Sản phẩm tạm hết"},
]

ORDER_STATUSES = [
    {"status_name": "Chờ xác nhận",  "sort_order": 1, "description": "Đơn hàng mới, chờ nhân viên xác nhận"},
    {"status_name": "Đang chuẩn bị", "sort_order": 2, "description": "Nhân viên đang pha chế"},
    {"status_name": "Đang giao hàng", "sort_order": 3, "description": "Đơn hàng đang được giao cho khách"},
    {"status_name": "Đã hoàn thành", "sort_order": 4, "description": "Đơn hàng đã giao cho khách"},
    {"status_name": "Đã hủy",        "sort_order": 5, "description": "Đơn hàng bị hủy"},
]

REWARD_TYPES = [
    {"type_name": "Gift",     "description": "Quà tặng vật phẩm"},
    {"type_name": "Discount", "description": "Mã giảm giá cho đơn hàng"},
]

POINT_TYPES = [
    {"type_name": "Earned", "description": "Điểm tích lũy từ đơn hàng hoàn thành"},
    {"type_name": "Spent",  "description": "Điểm sử dụng để đổi quà/ưu đãi"},
]

MEMBER_TIERS = [
    {"tier_name": "Đồng", "tier_order": 1, "exp_required": 0, "discount_percent": 0.0, "icon": "🥉", "color": "#CD7F32"},
    {"tier_name": "Bạc", "tier_order": 2, "exp_required": 10000, "discount_percent": 2.0, "icon": "🥈", "color": "#C0C0C0"},
    {"tier_name": "Vàng", "tier_order": 3, "exp_required": 30000, "discount_percent": 2.0, "icon": "🥇", "color": "#FFD700"},
    {"tier_name": "Kim Cương", "tier_order": 4, "exp_required": 100000, "discount_percent": 5.0, "icon": "💎", "color": "#B9F2FF"},
]

USERS = [
    {"username": "admin", "password_raw": "admin123", "role_id": 3, "total_points": 0, "total_exp": 0, "tier_id": 1, "is_active": True},
    {"username": "staff", "password_raw": "staff123", "role_id": 2, "total_points": 0, "total_exp": 0, "tier_id": 1, "is_active": True},
    {"username": "khachhang", "password_raw": "khach123", "role_id": 1, "total_points": 5000, "total_exp": 5000, "tier_id": 1, "is_active": True},
]

CATEGORIES = [
    {"id": 1, "category_name": "Cà phê"},
    {"id": 2, "category_name": "Trà sữa"},
    {"id": 3, "category_name": "Trà trái cây"},
    {"id": 4, "category_name": "Sinh tố & Nước ép"},
    {"id": 5, "category_name": "Đồ ăn vặt"},
]

PRODUCTS = [
    {"name": "Cà phê đen đá", "price": 25000, "category_id": 1, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1514432324607-a2ce78c73c16?q=80&w=1470&auto=format&fit=crop"},
    {"name": "Cà phê sữa đá", "price": 29000, "category_id": 1, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1620054707328-973e80c44c50?q=80&w=1470&auto=format&fit=crop"},
    {"name": "Bạc xỉu", "price": 35000, "category_id": 1, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1478&auto=format&fit=crop"},
    {"name": "Trà sữa trân châu", "price": 35000, "category_id": 2, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1622283088737-1249b29e616c?q=80&w=1470&auto=format&fit=crop"},
    {"name": "Trà đào cam sả", "price": 40000, "category_id": 3, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1470&auto=format&fit=crop"},
    {"name": "Sinh tố bơ", "price": 45000, "category_id": 4, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1626895316335-50269e94443a?q=80&w=1470&auto=format&fit=crop"},
    {"name": "Nước ép cam", "price": 39000, "category_id": 4, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1587&auto=format&fit=crop"},
    {"name": "Hạt dưa", "price": 15000, "category_id": 5, "status_id": 1, "image_url": "https://images.unsplash.com/photo-1596649282361-0498b813b194?q=80&w=1328&auto=format&fit=crop"},
]


def seed_table(db: Session, model, data: list[dict], unique_field: str):
    """Insert rows if they don't already exist (idempotent)."""
    for item in data:
        exists = db.query(model).filter(
            getattr(model, unique_field) == item[unique_field]
        ).first()
        if not exists:
            db.add(model(**item))
    db.commit()


def seed_loyalty_config(db: Session):
    """Ensure default loyalty config exists."""
    existing = db.query(LoyaltyConfig).filter(LoyaltyConfig.is_active == True).first()
    if not existing:
        config = LoyaltyConfig(
            earning_rate=0.0500,
            description="Mặc định: tích 5% giá trị đơn hàng thành điểm thưởng",
            is_active=True,
        )
        db.add(config)
        db.commit()


def run_seed():
    """Execute all seeds."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding roles...")
        seed_table(db, Role, ROLES, "role_name")

        print("Seeding product_statuses...")
        seed_table(db, ProductStatus, PRODUCT_STATUSES, "status_name")

        print("Seeding order_statuses...")
        seed_table(db, OrderStatus, ORDER_STATUSES, "status_name")

        print("Seeding reward_types...")
        seed_table(db, RewardType, REWARD_TYPES, "type_name")

        print("Seeding point_types...")
        seed_table(db, PointType, POINT_TYPES, "type_name")

        print("Seeding member_tiers...")
        # Upsert: Cập nhật exp_required và discount_percent nếu tier đã tồn tại
        for tier_data in MEMBER_TIERS:
            existing = db.query(MemberTier).filter(
                MemberTier.tier_name == tier_data["tier_name"]
            ).first()
            if existing:
                existing.exp_required = tier_data["exp_required"]
                existing.discount_percent = tier_data["discount_percent"]
            else:
                db.add(MemberTier(**tier_data))
        db.commit()

        print("Seeding loyalty_config...")
        seed_loyalty_config(db)

        print("Seeding users...")
        for user_data in USERS:
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing:
                hashed_pw = get_password_hash(user_data["password_raw"])
                u = dict(user_data)
                del u["password_raw"]
                u["password"] = hashed_pw
                db.add(User(**u))
        db.commit()

        print("Seeding categories...")
        seed_table(db, Category, CATEGORIES, "category_name")

        print("Seeding products...")
        seed_table(db, Product, PRODUCTS, "name")

        print("Seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
