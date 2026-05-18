from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

# Lưu ý: Sửa dòng get_db này theo đúng cấu trúc thư mục của bạn (ví dụ: database.database hoặc database.connection)
from database.connection import get_db
from app.controllers import user as crud_user
from app import security
from database.schemas.user import UserCreate

from app.dependencies import get_current_user

router = APIRouter()

# Schema nhận JSON từ Frontend gửi lên
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

# Initialize Firebase Admin
try:
    firebase_admin.get_app()
except ValueError:
    # Pointing to the file you just added
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

class AuthRequest(BaseModel):
    username: str # Phone number
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    firebase_token: Optional[str] = None # Received from frontend after SMS verify

@router.post("/register")
def register(req: AuthRequest, db: Session = Depends(get_db)):
    try:
        # 1. Verify Firebase Token
        try:
            decoded_token = firebase_auth.verify_id_token(req.firebase_token)
            phone_in_token = decoded_token.get("phone_number")
            if not phone_in_token:
                 raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc thiếu số điện thoại")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Xác thực Firebase thất bại: {str(e)}")

        # 2. Check if user exists
        db_user = crud_user.get_user_by_username(db, username=req.username)
        if db_user:
            raise HTTPException(status_code=400, detail="Số điện thoại này đã được đăng ký")
        
        # 3. Create user
        user_in = UserCreate(
            username=req.username, 
            password=req.password,
            full_name=req.full_name,
            email=req.email
        )
        new_user = crud_user.create_user(db, user=user_in)
        
        # 4. Auto-grant Bronze Voucher
        from database.models.reward import Reward
        from database.models.user_reward import UserReward
        bronze_reward = db.query(Reward).filter(Reward.name.ilike("%Voucher Hạng Đồng%")).first()
        if bronze_reward:
            ur = UserReward(user_id=new_user.id, reward_id=bronze_reward.id)
            db.add(ur)
            db.commit()
        
        # Return token
        access_token = security.create_access_token(data={"sub": new_user.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "full_name": new_user.full_name,
                "role_id": new_user.role_id,
                "tier_id": new_user.tier_id
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        print(traceback.format_exc()) # In ra terminal của backend
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống Backend: {str(e)}")

@router.post("/pos-register")
def pos_register(req: AuthRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Only staff/admin can use this
    if current_user.role_id not in [2, 3]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền thực hiện chức năng này")
        
    db_user = crud_user.get_user_by_username(db, username=req.username)
    if db_user:
        return {
            "message": "Tài khoản đã tồn tại",
            "user": {
                "id": db_user.id,
                "username": db_user.username,
                "full_name": db_user.full_name
            }
        }
    
    # Create with default password '123456'
    password = req.password or "123456"
    user_in = UserCreate(
        username=req.username, 
        password=password,
        full_name=req.full_name or f"Khách hàng {req.username[-4:]}"
    )
    new_user = crud_user.create_user(db, user=user_in)
    
    return {
        "message": "Đã tạo tài khoản nhanh",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "full_name": new_user.full_name
        }
    }

@router.post("/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_username(db, username=req.username)
    
    if not db_user or not security.verify_password(req.password, db_user.password):
        raise HTTPException(status_code=400, detail="Sai số điện thoại hoặc mật khẩu")
    
    access_token = security.create_access_token(data={"sub": db_user.username})
    
    tier_data = None
    if db_user.tier:
        tier_data = {
            "id": db_user.tier.id,
            "tier_name": db_user.tier.tier_name,
            "tier_order": db_user.tier.tier_order,
            "exp_required": db_user.tier.exp_required,
            "discount_percent": float(db_user.tier.discount_percent),
            "color": db_user.tier.color,
            "icon": db_user.tier.icon
        }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "full_name": db_user.full_name,
            "role_id": db_user.role_id,
            "avatar_url": db_user.avatar_url,
            "total_points": db_user.total_points,
            "tier": tier_data
        }
    }

@router.post("/check-phone")
def check_phone(req: AuthRequest, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_username(db, username=req.username)
    if not db_user:
        raise HTTPException(status_code=404, detail="Số điện thoại chưa được đăng ký")
    return {"message": "Số điện thoại hợp lệ"}

@router.post("/reset-password")
def reset_password(req: AuthRequest, db: Session = Depends(get_db)):
    try:
        # 1. Verify Firebase Token
        decoded_token = firebase_auth.verify_id_token(req.firebase_token)
        phone_in_token = decoded_token.get("phone_number")
        if not phone_in_token:
             raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc thiếu số điện thoại")
             
        # 2. Find user by phone in token
        stored_username = phone_in_token
        if phone_in_token.startswith("+84"):
            stored_username = "0" + phone_in_token[3:]
            
        db_user = crud_user.get_user_by_username(db, username=stored_username)
        if not db_user:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản với số điện thoại này")
            
        # 3. Update password
        from app.security import get_password_hash
        db_user.password = get_password_hash(req.password) # Dùng trường password làm mật khẩu mới
        db.commit()
        
        return {"message": "Đặt lại mật khẩu thành công"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống Backend: {str(e)}")