"""
Seed data – Chèn dữ liệu khởi tạo cho các bảng lookup.
Chạy:  python -m database.seeds.seed
"""
from sqlalchemy.orm import Session

from database.connection import SessionLocal, engine, Base
from database.models import (
    Role, ProductStatus, OrderStatus,
    RewardType, PointType, LoyaltyConfig, MemberTier
)


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

        print("Seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
