"""
Mock Data Seed – Chèn dữ liệu mẫu cho các bảng chính (Users, Categories, Products, Rewards).
Chạy: python -m database.seeds.mock_data
"""
import sys
from pathlib import Path

# Thêm thư mục gốc và thư mục backend vào sys.path
ROOT_DIR = Path(__file__).parent.parent.parent
sys.path.append(str(ROOT_DIR))
sys.path.append(str(ROOT_DIR / "backend"))

from sqlalchemy.orm import Session
from database.connection import SessionLocal, engine
from database.models import (
    User, Role, Category, Product, ProductStatus, 
    Reward, RewardType, OrderStatus
)
from backend.app.security import get_password_hash

# ---------- Dữ liệu mẫu ----------

CATEGORIES = [
    {"category_name": "Ca phe"},
    {"category_name": "Tra & Tra sua"},
    {"category_name": "Da xay"},
    {"category_name": "Banh & An nhe"},
]

# Map tên category với các sản phẩm tương ứng để seed chính xác hơn
PRODUCT_DATA = {
    "Ca phe": [
        {"name": "Espresso", "price": 35000, "image_url": "https://images.unsplash.com/photo-1510707577719-ea9111d3a4b9?q=80&w=200"},
        {"name": "Bac xiu", "price": 45000, "image_url": "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=200"},
        {"name": "Cappuccino", "price": 55000, "image_url": "https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=200"},
    ],
    "Tra & Tra sua": [
        {"name": "Tra dao sa vai", "price": 49000, "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=200"},
        {"name": "Tra sua truyen thong", "price": 40000, "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=200"},
    ],
    "Da xay": [
        {"name": "Chocolate da xay", "price": 59000, "image_url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=200"},
    ],
    "Banh & An nhe": [
        {"name": "Banh mi que", "price": 15000, "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200"},
        {"name": "Tiramisu", "price": 45000, "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=200"},
    ]
}

REWARDS = [
    {"name": "Giam 10% don hang", "description": "Ap dung cho don tren 100k", "points_required": 100, "type_name": "Discount", "discount_value": 10},
    {"name": "Mien phi 1 ly Ca phe", "description": "Doi 1 ly ca phe bat ky", "points_required": 50, "type_name": "Gift", "discount_value": 0},
    # Voucher tự động tặng khi thăng hạng (không cần đổi điểm, points_required=1 để qua constraint DB)
    {"name": "Voucher Hạng Đồng", "description": "Voucher giảm 30.000đ khi đăng ký thành viên", "points_required": 1, "type_name": "Discount", "discount_value": 30000},
    {"name": "Voucher Hạng Vàng", "description": "Voucher giảm 50.000đ khi thăng hạng Vàng", "points_required": 1, "type_name": "Discount", "discount_value": 50000},
]

def seed_users(db: Session):
    print("Seeding users...")
    def get_role_id(name):
        role = db.query(Role).filter(Role.role_name == name).first()
        return role.id if role else None

    users = [
        {"username": "admin", "password": get_password_hash("admin123"), "role_id": get_role_id("Admin")},
        {"username": "staff01", "password": get_password_hash("staff123"), "role_id": get_role_id("Staff")},
        {"username": "customer01", "password": get_password_hash("password123"), "role_id": get_role_id("Customer"), "total_points": 150},
        {"username": "customer02", "password": get_password_hash("password123"), "role_id": get_role_id("Customer"), "total_points": 20},
    ]

    for u_data in users:
        if not u_data["role_id"]: continue
        exists = db.query(User).filter(User.username == u_data["username"]).first()
        if not exists:
            db.add(User(**u_data))
    db.commit()

def seed_categories(db: Session):
    print("Seeding categories...")
    for c_data in CATEGORIES:
        exists = db.query(Category).filter(Category.category_name == c_data["category_name"]).first()
        if not exists:
            db.add(Category(**c_data))
    db.commit()

def seed_products(db: Session):
    print("Seeding products...")
    # Lấy status_id mặc định (In stock)
    status = db.query(ProductStatus).filter(ProductStatus.status_name == "In stock").first()
    status_id = status.id if status else 1

    for cat_name, products in PRODUCT_DATA.items():
        cat = db.query(Category).filter(Category.category_name == cat_name).first()
        if not cat: continue
        
        for p_data in products:
            exists = db.query(Product).filter(Product.name == p_data["name"]).first()
            if exists:
                exists.price = p_data["price"]
                exists.quantity = 50
                exists.image_url = p_data.get("image_url")
            else:
                new_product = Product(
                    name=p_data["name"],
                    price=p_data["price"],
                    category_id=cat.id,
                    status_id=status_id,
                    image_url=p_data.get("image_url"),
                    quantity=50 # Cho phép đặt hàng ngay sau khi seed
                )
                db.add(new_product)
    db.commit()

def seed_rewards(db: Session):
    print("Seeding rewards...")
    # Danh sách các voucher tự động (không hiển thị trong cửa hàng quà)
    auto_grant_names = ["Voucher Hạng Đồng", "Voucher Hạng Vàng"]
    
    for r_data in REWARDS:
        exists = db.query(Reward).filter(Reward.name == r_data["name"]).first()
        if not exists:
            reward_type = db.query(RewardType).filter(RewardType.type_name == r_data["type_name"]).first()
            if reward_type:
                is_auto = r_data["name"] in auto_grant_names
                db.add(Reward(
                    name=r_data["name"],
                    description=r_data["description"],
                    points_required=r_data["points_required"],
                    reward_type_id=reward_type.id,
                    discount_value=r_data["discount_value"],
                    is_active=not is_auto  # Voucher tự động: ẩn khỏi cửa hàng
                ))
    db.commit()

def seed_tier_rewards(db: Session):
    """Seed bảng tier_rewards để lưu quy tắc thưởng theo hạng"""
    from database.models.tier_reward import TierReward
    from database.models.member_tier import MemberTier
    
    print("Seeding tier_rewards...")
    
    TIER_REWARDS = [
        {"tier_name": "Đồng", "reward_type": "VOUCHER_S", "description": "Tặng 1 Voucher giảm 30.000đ khi đăng ký", "quantity": 1},
        {"tier_name": "Bạc", "reward_type": "PERMANENT_DISCOUNT", "description": "Giảm giá 2% mọi đơn hàng vĩnh viễn", "quantity": 1},
        {"tier_name": "Vàng", "reward_type": "VOUCHER_L", "description": "Tặng 2 Voucher, mỗi voucher giảm 50.000đ khi thăng hạng", "quantity": 2},
        {"tier_name": "Kim Cương", "reward_type": "PERMANENT_DISCOUNT", "description": "Giảm giá 5% mọi đơn hàng vĩnh viễn", "quantity": 1},
    ]
    
    for tr_data in TIER_REWARDS:
        tier = db.query(MemberTier).filter(MemberTier.tier_name == tr_data["tier_name"]).first()
        if tier:
            exists = db.query(TierReward).filter(
                TierReward.tier_id == tier.id,
                TierReward.reward_type == tr_data["reward_type"]
            ).first()
            if not exists:
                db.add(TierReward(
                    tier_id=tier.id,
                    reward_type=tr_data["reward_type"],
                    description=tr_data["description"],
                    quantity=tr_data["quantity"]
                ))
    db.commit()

def run_mock_seed():
    db = SessionLocal()
    try:
        seed_users(db)
        seed_categories(db)
        seed_products(db)
        seed_rewards(db)
        seed_tier_rewards(db)
        print("Mock data seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_mock_seed()
