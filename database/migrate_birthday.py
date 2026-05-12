import sys
from pathlib import Path

# Thêm thư mục gốc vào sys.path
ROOT_DIR = Path(__file__).parent.parent
sys.path.append(str(ROOT_DIR))

from sqlalchemy import text
from database.connection import engine

queries = [
    "ALTER TABLE users ADD COLUMN birthday DATE DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN last_birthday_wish_year INTEGER DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN birthday_locked BOOLEAN NOT NULL DEFAULT FALSE"
]

for q in queries:
    try:
        with engine.begin() as conn:
            conn.execute(text(q))
            print("OK:", q)
    except Exception as e:
        print("Bỏ qua lỗi:", str(e).split('\n')[0])
