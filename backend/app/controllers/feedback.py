# backend/app/controllers/feedback.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from sqlalchemy.orm import Session
from database.models.feedback import Feedback
from database.models.user import User
from database.schemas.feedback import FeedbackCreate
from backend.app.config import settings

logger = logging.getLogger("coffee_manager_feedback")


def send_feedback_email_task(
    category: str,
    content: str,
    username: str,
    full_name: str | None,
    email: str | None
):
    """
    Tiến trình nền (Background Task) để gửi email SMTP cho Admin.
    Được thiết kế chống lỗi (Fault-tolerant): Nếu cấu hình SMTP trống hoặc xảy ra lỗi kết nối,
    hệ thống sẽ log cảnh báo và không làm gián đoạn trải nghiệm của người dùng.
    """
    # 1. Kiểm tra cấu hình SMTP
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP credentials not fully configured in .env. Skipping email sending. "
            "Feedback is successfully saved in Database."
        )
        return

    try:
        # 2. Xây dựng nội dung Email HTML Premium
        sender = settings.SMTP_SENDER or settings.SMTP_USERNAME
        recipient = settings.ADMIN_EMAIL or settings.SMTP_USERNAME

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Coffee Manager] Phản Hồi Mới: {category}"
        msg["From"] = sender
        msg["To"] = recipient

        # Layout HTML hiện đại, sang trọng (Glassmorphism & Coffee Palette)
        html_content = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f5f2; margin: 0; padding: 20px; color: #3e2723;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #efebe9;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #4e342e, #3e2723); padding: 30px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">COFFEE MANAGER</h1>
                    <p style="margin: 5px 0 0 0; color: #d7ccc8; font-size: 14px;">Hệ Thống Ghi Nhận Phản Hồi Ý Kiến Khách Hàng</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 30px;">
                    <h2 style="margin-top: 0; font-size: 18px; border-bottom: 2px solid #d7ccc8; padding-bottom: 10px; color: #4e342e;">
                        Thông Tin Khách Hàng
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; width: 140px; color: #5d4037;">Tài khoản (ID):</td>
                            <td style="padding: 6px 0; color: #3e2723;">{username}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #5d4037;">Họ và Tên:</td>
                            <td style="padding: 6px 0; color: #3e2723;">{full_name or "Chưa cập nhật"}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-weight: bold; color: #5d4037;">Email cá nhân:</td>
                            <td style="padding: 6px 0; color: #3e2723;">{email or "Chưa cung cấp"}</td>
                        </tr>
                    </table>

                    <h2 style="font-size: 18px; border-bottom: 2px solid #d7ccc8; padding-bottom: 10px; color: #4e342e; margin-top: 30px;">
                        Nội Dung Góp Ý
                    </h2>
                    <div style="margin-bottom: 15px; margin-top: 15px;">
                        <span style="background-color: #d7ccc8; color: #4e342e; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                            {category}
                        </span>
                    </div>
                    
                    <div style="background-color: #efebe9; border-left: 4px solid #8d6e63; padding: 20px; border-radius: 0 8px 8px 0; font-style: italic; line-height: 1.6; color: #3e2723; margin-top: 10px;">
                        "{content.replace(chr(10), '<br>')}"
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #efebe9; padding: 20px; text-align: center; font-size: 12px; color: #795548; border-top: 1px solid #d7ccc8;">
                    <p style="margin: 0;">Thư thông báo tự động từ hệ thống quản lý Coffee Manager.</p>
                    <p style="margin: 5px 0 0 0; font-weight: bold;">Vui lòng không phản hồi trực tiếp vào địa chỉ này.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, "html"))

        # 3. Kết nối SMTP Server và gửi Mail
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()  # Bảo mật đường truyền bằng TLS
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(sender, [recipient], msg.as_string())
        server.quit()

        logger.info(f"Successfully sent feedback email to Admin receiver: {recipient}")
    except Exception as e:
        logger.error(f"Failed to send feedback email: {e}", exc_info=True)


def create_feedback(db: Session, feedback_in: FeedbackCreate, user_id: int) -> Feedback:
    """
    Tạo phản hồi mới trong cơ sở dữ liệu.
    """
    db_feedback = Feedback(
        user_id=user_id,
        category=feedback_in.category,
        content=feedback_in.content
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def get_feedbacks(db: Session):
    """
    Lấy danh sách tất cả các phản hồi kèm thông tin người gửi (dành cho Admin).
    """
    # Thực hiện JOIN bảng User để lấy đầy đủ username, full_name, email
    results = (
        db.query(Feedback, User)
        .join(User, Feedback.user_id == User.id)
        .order_by(Feedback.created_at.desc())
        .all()
    )

    feedbacks = []
    for f, u in results:
        feedbacks.append({
            "id": f.id,
            "user_id": f.user_id,
            "category": f.category,
            "content": f.content,
            "created_at": f.created_at,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email
        })
    return feedbacks
