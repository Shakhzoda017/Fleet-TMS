import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("", response_model=list[schemas.LoadOut])
def list_loads(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Load)
        .options(joinedload(models.Load.driver))
        .filter(models.Load.deleted_at.is_(None))
        .order_by(models.Load.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.LoadOut)
def create_load(payload: schemas.LoadCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    load = models.Load(**payload.model_dump())
    db.add(load)
    db.commit()
    db.refresh(load)
    return load


@router.get("/archive", response_model=list[schemas.LoadOut])
def list_archived_loads(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Load).filter(models.Load.deleted_at.isnot(None)).all()


@router.post("/archive/{load_id}/restore", response_model=schemas.LoadOut)
def restore_load(load_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    load = db.query(models.Load).filter(models.Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    load.deleted_at = None
    load.deleted_by = None
    db.commit()
    db.refresh(load)
    return load


@router.delete("/archive/{load_id}", status_code=204)
def permanently_delete_load(load_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    load = db.query(models.Load).filter(models.Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    db.delete(load)
    db.commit()


@router.put("/{load_id}", response_model=schemas.LoadOut)
def update_load(load_id: int, payload: schemas.LoadCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.deleted_at.is_(None)).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    for k, v in payload.model_dump().items():
        setattr(load, k, v)
    db.commit()
    db.refresh(load)
    return load


@router.delete("/{load_id}", status_code=204)
def delete_load(load_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    load = db.query(models.Load).filter(models.Load.id == load_id, models.Load.deleted_at.is_(None)).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    load.deleted_at = datetime.datetime.utcnow()
    load.deleted_by = current_user.username
    db.commit()
