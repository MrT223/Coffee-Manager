import sys
from pathlib import Path

# Thêm thư mục gốc vào sys.path
ROOT_DIR = Path(__file__).parent.parent
sys.path.append(str(ROOT_DIR))

from sqlalchemy import text
from database.connection import engine, SessionLocal, Base
from database.models.member_tier import MemberTier

Base.metadata.create_all(bind=engine)

# 1. Seed dữ liệu MemberTier TRƯỚC
db = SessionLocal()
try:
    tiers = [
        {"tier_name": "Đồng", "tier_order": 1, "exp_required": 0, "discount_percent": 0.0, "icon": "🥉", "color": "#CD7F32"},
        {"tier_name": "Bạc", "tier_order": 2, "exp_required": 1000, "discount_percent": 2.0, "icon": "🥈", "color": "#C0C0C0"},
        {"tier_name": "Vàng", "tier_order": 3, "exp_required": 3000, "discount_percent": 0.0, "icon": "🥇", "color": "#FFD700"},
        {"tier_name": "Kim Cương", "tier_order": 4, "exp_required": 10000, "discount_percent": 5.0, "icon": "💎", "color": "#B9F2FF"},
    ]
    for t_data in tiers:
        exists = db.query(MemberTier).filter(MemberTier.tier_order == t_data["tier_order"]).first()
        if not exists:
            db.add(MemberTier(**t_data))
    db.commit()
except Exception as e:
    db.rollback()
    print("Lỗi seed tier:", e)
finally:
    db.close()

# 2. Alter tables
queries = [
    "ALTER TABLE users ADD COLUMN total_exp INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN tier_id INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE users ADD CONSTRAINT fk_user_tier FOREIGN KEY (tier_id) REFERENCES member_tiers(id) ON DELETE RESTRICT ON UPDATE CASCADE",
    "ALTER TABLE order_details ADD COLUMN combo_id INTEGER DEFAULT NULL",
    "ALTER TABLE order_details ADD CONSTRAINT fk_od_combo FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE SET NULL ON UPDATE CASCADE",
    "UPDATE users SET total_points = 0, total_exp = 0, tier_id = 1"
]

for q in queries:
    try:
        with engine.begin() as conn:
            conn.execute(text(q))
            print("OK:", q)
    except Exception as e:
        print("Bỏ qua lỗi:", str(e).split('\n')[0])
