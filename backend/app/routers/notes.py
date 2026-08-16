from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[schemas.NoteOut])
def list_notes(entity_type: str, entity_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Note)
        .filter(models.Note.entity_type == entity_type, models.Note.entity_id == entity_id)
        .order_by(models.Note.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.NoteOut)
def create_note(
    payload: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    note = models.Note(
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        text=payload.text,
        author=current_user.username,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
