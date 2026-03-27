# backend/app/main.py
import sys
import os
# Lấy đường dẫn thư mục gốc (Coffee-Manager)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# --- IMPORT ROUTER ---
from app.routes import auth

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KẾT NỐI API ---
# Đường dẫn cuối cùng sẽ là: /api/auth/register và /api/auth/login
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])


@app.get("/")
def root():
    return {"message": "Welcome to Coffee Manager API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}