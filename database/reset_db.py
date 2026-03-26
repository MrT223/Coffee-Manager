"""
Reset database: xoa toan bo tables va tao lai tu dau + seed.
Chay:  python -m database.reset_db
"""
from database.connection import engine, Base
from database.models import *  # noqa: F401,F403
from database.seeds.seed import run_seed


def reset_db():
    print("!!! CANH BAO: Xoa TOAN BO du lieu trong database !!!")
    confirm = input("Nhap 'YES' de xac nhan: ")
    if confirm != "YES":
        print("Da huy.")
        return

    print("\nDang xoa toan bo tables...")
    Base.metadata.drop_all(bind=engine)
    print("Da xoa xong.")

    print("\nDang tao lai tables...")
    Base.metadata.create_all(bind=engine)
    print("Da tao lai xong.")

    print("\nDang seed du lieu...")
    run_seed()
    print("\nReset hoan tat!")


if __name__ == "__main__":
    reset_db()
