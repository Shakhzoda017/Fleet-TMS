from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..models import FINANCIAL_KINDS

router = APIRouter(prefix="/financials", tags=["financials"])


@router.get("", response_model=list[schemas.FinancialEntryOut])
def list_financial_entries(
    driver_id: int, kind: str, db: Session = Depends(get_db), _=Depends(get_current_user)
):
    if kind not in FINANCIAL_KINDS:
        raise HTTPException(status_code=400, detail=f"kind must be one of {FINANCIAL_KINDS}")
    return (
        db.query(models.FinancialEntry)
        .filter(models.FinancialEntry.driver_id == driver_id, models.FinancialEntry.kind == kind)
        .order_by(models.FinancialEntry.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.FinancialEntryOut)
def create_financial_entry(
    payload: schemas.FinancialEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.kind not in FINANCIAL_KINDS:
        raise HTTPException(status_code=400, detail=f"kind must be one of {FINANCIAL_KINDS}")
    entry = models.FinancialEntry(**payload.model_dump(), created_by=current_user.username)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_financial_entry(entry_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entry = db.query(models.FinancialEntry).filter(models.FinancialEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
