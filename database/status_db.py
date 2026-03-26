"""
Kiem tra trang thai database: ket noi, tables, so luong records.
Chay:  python -m database.status_db
"""
from database.connection import engine, SessionLocal, Base
from database.models import *  # noqa: F401,F403
from sqlalchemy import text, inspect


def status_db():
    # 1. Test connection
    print("=" * 50)
    print("  DATABASE STATUS")
    print("=" * 50)

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"\n[OK] Ket noi: {engine.url}")
    except Exception as e:
        print(f"\n[FAIL] Khong the ket noi: {e}")
        return

    # 2. Check tables
    inspector = inspect(engine)
    db_tables = sorted(inspector.get_table_names())
    expected = sorted(Base.metadata.tables.keys())

    print(f"\n[Tables] {len(db_tables)}/{len(expected)} tables ton tai")

    missing = set(expected) - set(db_tables)
    if missing:
        print(f"  THIEU: {missing}")

    # 3. Row counts
    if db_tables:
        print(f"\n{'Table':<30} {'Rows':>8}")
        print("-" * 40)
        db = SessionLocal()
        try:
            for t in db_tables:
                if t in expected:
                    count = db.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar()
                    print(f"  {t:<28} {count:>8}")
        finally:
            db.close()

    print("\n" + "=" * 50)


if __name__ == "__main__":
    status_db()
