"""
Migration: Them cac cot con thieu vao bang users
- full_name, email (tu feature/google-auth)
- birthday, last_birthday_wish_year, birthday_locked (tu feature/birthday)
- total_exp, tier_id (tu feature/loyalty-tier)

Chay:  python -m database.migrate_user_columns
"""
from sqlalchemy import text
from database.connection import engine


def migrate():
    columns_to_add = [
        # (column_name, sql_definition)
        ("full_name",              "VARCHAR(200)"),
        ("email",                  "VARCHAR(200)"),
        ("birthday",               "DATE"),
        ("last_birthday_wish_year","INTEGER"),
        ("birthday_locked",        "BOOLEAN NOT NULL DEFAULT FALSE"),
        ("total_exp",              "INTEGER NOT NULL DEFAULT 0"),
        ("tier_id",                "INTEGER DEFAULT 1"),
    ]

    with engine.connect() as conn:
        for col_name, col_def in columns_to_add:
            # Kiem tra cot da ton tai chua
            result = conn.execute(text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name = 'users' AND column_name = :col"
            ), {"col": col_name}).fetchone()

            if result:
                print(f"[INFO] Cot '{col_name}' da ton tai")
            else:
                conn.execute(text(
                    f'ALTER TABLE users ADD COLUMN {col_name} {col_def}'
                ))
                print(f"[OK]   Da them cot '{col_name}'")

        # Them foreign key tier_id -> member_tiers neu chua co
        fk_exists = conn.execute(text(
            "SELECT 1 FROM information_schema.table_constraints "
            "WHERE constraint_name = 'fk_users_tier' AND table_name = 'users'"
        )).fetchone()
        if not fk_exists:
            try:
                conn.execute(text(
                    "ALTER TABLE users ADD CONSTRAINT fk_users_tier "
                    "FOREIGN KEY (tier_id) REFERENCES member_tiers (id) "
                    "ON UPDATE CASCADE ON DELETE RESTRICT"
                ))
                print("[OK]   Da them FK fk_users_tier")
            except Exception as e:
                print(f"[WARN] Khong them duoc FK fk_users_tier: {e}")
        else:
            print("[INFO] FK fk_users_tier da ton tai")

        # Them CHECK constraints neu chua co
        for chk_name, chk_expr in [
            ("chk_users_total_exp", "total_exp >= 0"),
        ]:
            chk_exists = conn.execute(text(
                "SELECT 1 FROM information_schema.table_constraints "
                "WHERE constraint_name = :name AND table_name = 'users'"
            ), {"name": chk_name}).fetchone()
            if not chk_exists:
                try:
                    conn.execute(text(
                        f"ALTER TABLE users ADD CONSTRAINT {chk_name} CHECK ({chk_expr})"
                    ))
                    print(f"[OK]   Da them CHECK {chk_name}")
                except Exception as e:
                    print(f"[WARN] Khong them duoc CHECK {chk_name}: {e}")
            else:
                print(f"[INFO] CHECK {chk_name} da ton tai")

        conn.commit()

    print("\n[DONE] Migration user columns hoan tat!")


if __name__ == "__main__":
    migrate()
