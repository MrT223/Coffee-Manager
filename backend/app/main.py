# backend/app/main.py
import sys
import os
# Lấy đường dẫn thư mục gốc (Coffee-Manager)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# --- IMPORT ROUTER ---
from app.routes.auth import router as auth_router
from app.routes.category import router as category_router
from app.routes.product import router as product_router
from app.routes.order import router as order_router
from app.routes.reward import router as reward_router
from app.routes.user import router as user_router
from app.routes.loyalty import router as loyalty_router
from app.routes.user_reward import router as user_reward_router
from app.routes.profile import router as profile_router
from app.routes.combo import router as combo_router
from app.routes.feedback import router as feedback_router
from app.routes.vnpay import router as vnpay_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://falsify-fancy-barometer.ngrok-free.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KẾT NỐI API ---
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(category_router, prefix="/api/categories", tags=["Categories"])
app.include_router(product_router, prefix="/api/products", tags=["Products"])
app.include_router(order_router, prefix="/api/orders", tags=["Orders"])
app.include_router(reward_router, prefix="/api/rewards", tags=["Rewards"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(loyalty_router, prefix="/api/loyalty", tags=["Loyalty"])
app.include_router(user_reward_router, prefix="/api/user-rewards", tags=["UserRewards"])
app.include_router(profile_router, prefix="/api/profile", tags=["Profile"])
app.include_router(combo_router, prefix="/api/combos", tags=["Combos"])
app.include_router(feedback_router, prefix="/api/feedback", tags=["Feedback"])
app.include_router(vnpay_router, prefix="/api/vnpay", tags=["VNPay"])

@app.get("/")
def root():
    return {"message": "Welcome to Coffee Manager API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}