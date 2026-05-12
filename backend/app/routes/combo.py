from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from app.dependencies import get_current_user, get_current_staff
from app.controllers import combo as combo_controller
from database.schemas.combo import ComboCreate, ComboUpdate, ComboRead
from database.models.user import User

router = APIRouter()


@router.get("/", response_model=List[ComboRead])
def read_combos(
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách combo.
    """
    return combo_controller.get_combos(db=db, active_only=active_only)


@router.get("/{combo_id}", response_model=ComboRead)
def read_combo(
    combo_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết 1 combo.
    """
    combo = combo_controller.get_combo(db=db, combo_id=combo_id)
    if not combo:
        raise HTTPException(status_code=404, detail="Không tìm thấy combo")
    return combo


@router.post("/", response_model=ComboRead, status_code=status.HTTP_201_CREATED)
def create_new_combo(
    combo_in: ComboCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Tạo combo mới (Staff only).
    """
    return combo_controller.create_combo(db=db, combo_in=combo_in)


@router.put("/{combo_id}", response_model=ComboRead)
def update_existing_combo(
    combo_id: int,
    combo_in: ComboUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Cập nhật combo (Staff only).
    """
    return combo_controller.update_combo(db=db, combo_id=combo_id, combo_in=combo_in)


@router.delete("/{combo_id}")
def delete_existing_combo(
    combo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    Xóa combo (Staff only).
    """
    success = combo_controller.delete_combo(db=db, combo_id=combo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy combo")
    return {"message": "Xóa combo thành công"}
