from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/audit-log", tags=["audit-log"])


@router.get("", response_model=list[schemas.AuditLogOut])
def list_audit_log(entity_type: str, entity_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.AuditLogEntry)
        .filter(models.AuditLogEntry.entity_type == entity_type, models.AuditLogEntry.entity_id == entity_id)
        .order_by(models.AuditLogEntry.created_at.desc())
        .all()
    )
