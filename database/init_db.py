"""
Khoi tao database: tu dong tao database neu chua co, tao tables + seed.
Chay:  python -m database.init_db
"""
from sqlalchemy import create_engine, text
from database.connection import DATABASE_URL, engine, Base
from database.models import *  # noqa: F401,F403
from database.seeds.seed import run_seed


def ensure_database_exists():
    """Tao database neu chua ton tai."""
    # Parse DB name from URL
    # postgresql://user:pass@host:port/db_name
    db_name = DATABASE_URL.rsplit("/", 1)[-1]
    server_url = DATABASE_URL.rsplit("/", 1)[0] + "/postgres"

    try:
        temp_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
        with temp_engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": db_name}
            ).fetchone()

            if not result:
                print(f"Database '{db_name}' chua ton tai, dang tao...")
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                print(f"Da tao database '{db_name}'.")
            else:
                print(f"Database '{db_name}' da ton tai.")

        temp_engine.dispose()
    except Exception as e:
        print(f"Khong the kiem tra/tao database: {e}")
        print("Thu tao thu cong hoac dung option [6] trong manage_db.bat")
        raise


def init_db():
    ensure_database_exists()

    print("\nDang tao tables...")
    Base.metadata.create_all(bind=engine)
    print("Tao tables thanh cong!")

    print("\nDang seed du lieu...")
    run_seed()


if __name__ == "__main__":
    init_db()
