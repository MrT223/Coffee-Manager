# backend/app/routes/feedback.py
from fastapi import APIRouter, Depends, BackgroundTasks, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from database.schemas.feedback import FeedbackCreate, FeedbackRead
from app.controllers import feedback as controller_feedback
from app.dependencies import get_current_user, get_current_staff
from database.models.user import User

router = APIRouter()


@router.post("/", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    feedback_in: FeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    API gửi phản hồi ý kiến cho Admin (UC-13).
    Sau khi lưu thành công vào CSDL, tiến trình gửi email sẽ được thực hiện bất đồng bộ (Background Task).
    """
    # Chỉ Khách Hàng (role_id == 1) mới được phép gửi phản hồi
    if current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Khách Hàng mới được phép gửi ý kiến phản hồi!"
        )

    # 1. Lưu CSDL
    db_feedback = controller_feedback.create_feedback(db, feedback_in, current_user.id)
    
    # 2. Đăng ký luồng nền gửi Email SMTP
    background_tasks.add_task(
        controller_feedback.send_feedback_email_task,
        category=feedback_in.category,
        content=feedback_in.content,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email
    )
    
    # Gán tạm thời thông tin người gửi vào kết quả trả về
    db_feedback.username = current_user.username
    db_feedback.full_name = current_user.full_name
    db_feedback.email = current_user.email
    
    return db_feedback


@router.get("/", response_model=List[FeedbackRead])
def read_feedbacks(
    db: Session = Depends(get_db),
    current_staff: User = Depends(get_current_staff)
):
    """
    API lấy danh sách toàn bộ phản hồi (Chỉ Staff và Admin).
    """
    return controller_feedback.get_feedbacks(db)
