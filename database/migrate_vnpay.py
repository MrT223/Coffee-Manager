"""
Migration script: Thêm các cột VNPay vào bảng orders
Chạy: python -m database.migrate_vnpay
"""
import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(ROOT_DIR)

from database.connection import engine
from sqlalchemy import text


def migrate():
    """Thêm các cột cho VNPay vào bảng orders."""
    with engine.connect() as conn:
        # Kiểm tra và thêm cột payment_method
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'payment_method'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE orders ADD COLUMN payment_method VARCHAR(10) NOT NULL DEFAULT 'CASH'
            """))
            print("[OK] Da them cot payment_method")
        else:
            print("[INFO] Cot payment_method da ton tai")

        # Kiểm tra và thêm cột vnp_txn_ref
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'vnp_txn_ref'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE orders ADD COLUMN vnp_txn_ref VARCHAR(50) UNIQUE
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_orders_vnp_txn_ref ON orders (vnp_txn_ref)
            """))
            print("[OK] Da them cot vnp_txn_ref")
        else:
            print("[INFO] Cot vnp_txn_ref da ton tai")

        # Kiểm tra và thêm cột vnp_transaction_no
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'vnp_transaction_no'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE orders ADD COLUMN vnp_transaction_no VARCHAR(50)
            """))
            print("[OK] Da them cot vnp_transaction_no")
        else:
            print("[INFO] Cot vnp_transaction_no da ton tai")

        conn.commit()
        print("\n[DONE] Migration VNPay hoan tat!")


if __name__ == "__main__":
    migrate()
