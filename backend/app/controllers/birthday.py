"""Birthday voucher controller
Provides function to issue a one-time 50% discount voucher on the user's birthday.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from database.models.user import User
from database.models.reward import Reward
from database.models.reward_type import RewardType
from database.models.user_reward import UserReward


def issue_birthday_voucher(db: Session, user: User):
    """Issue a birthday voucher for the given user.
    Uses a template reward to avoid creating multiple identical rewards.
    """
    if not user.birthday:
        return {"message": "Birthday not set", "reward": None}

    today = datetime.utcnow().date()
    if user.birthday.month != today.month or user.birthday.day != today.day:
        return {"message": "Not today", "reward": None}

    # 1. Ensure "Birthday" reward type exists
    reward_type = db.query(RewardType).filter(RewardType.type_name == "Birthday").first()
    if not reward_type:
        reward_type = RewardType(type_name="Birthday", description="Chương trình ưu đãi sinh nhật")
        db.add(reward_type)
        db.commit()
        db.refresh(reward_type)

    # 2. Ensure "Voucher Sinh Nhật 50%" template exists
    reward_template = db.query(Reward).filter(
        Reward.reward_type_id == reward_type.id,
        Reward.name == "Voucher Sinh Nhật 50%"
    ).first()

    if not reward_template:
        reward_template = Reward(
            name="Voucher Sinh Nhật 50%",
            description="Ưu đãi giảm giá 50% dành riêng cho ngày sinh nhật của bạn",
            points_required=0,
            reward_type_id=reward_type.id,
            discount_value=0.5,
            is_active=True,
            quantity=None # Không giới hạn số lượng template
        )
        db.add(reward_template)
        db.commit()
        db.refresh(reward_template)

    # 3. Check if user already received this voucher for the current year
    start_of_year = datetime(today.year, 1, 1)
    existing = (
        db.query(UserReward)
        .filter(
            UserReward.user_id == user.id,
            UserReward.reward_id == reward_template.id,
            UserReward.created_at >= start_of_year,
        )
        .first()
    )

    if existing:
        return {"message": "Already issued this year", "reward": None}

    # 4. Link template reward to user
    user_reward = UserReward(
        user_id=user.id,
        reward_id=reward_template.id,
        is_used=False
    )
    db.add(user_reward)
    db.commit()
    db.refresh(user_reward)

    return {
        "message": "Voucher issued",
        "reward": {
            "id": reward_template.id,
            "name": reward_template.name,
            "discount_value": float(reward_template.discount_value),
        },
    }
