import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/dispatchers", tags=["dispatchers"])


@router.get("", response_model=list[schemas.DispatcherOut])
def list_dispatchers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Dispatcher).filter(models.Dispatcher.deleted_at.is_(None)).all()


@router.post("", response_model=schemas.DispatcherOut)
def create_dispatcher(payload: schemas.DispatcherCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dispatcher = models.Dispatcher(**payload.model_dump())
    db.add(dispatcher)
    db.commit()
    db.refresh(dispatcher)
    return dispatcher


@router.get("/archive", response_model=list[schemas.DispatcherOut])
def list_archived_dispatchers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Dispatcher).filter(models.Dispatcher.deleted_at.isnot(None)).all()


@router.post("/archive/{dispatcher_id}/restore", response_model=schemas.DispatcherOut)
def restore_dispatcher(dispatcher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dispatcher = db.query(models.Dispatcher).filter(models.Dispatcher.id == dispatcher_id).first()
    if not dispatcher:
        raise HTTPException(status_code=404, detail="Dispatcher not found")
    dispatcher.deleted_at = None
    dispatcher.deleted_by = None
    db.commit()
    db.refresh(dispatcher)
    return dispatcher


@router.delete("/archive/{dispatcher_id}", status_code=204)
def permanently_delete_dispatcher(dispatcher_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dispatcher = db.query(models.Dispatcher).filter(models.Dispatcher.id == dispatcher_id).first()
    if not dispatcher:
        raise HTTPException(status_code=404, detail="Dispatcher not found")
    db.delete(dispatcher)
    db.commit()


@router.put("/{dispatcher_id}", response_model=schemas.DispatcherOut)
def update_dispatcher(dispatcher_id: int, payload: schemas.DispatcherCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    dispatcher = db.query(models.Dispatcher).filter(models.Dispatcher.id == dispatcher_id, models.Dispatcher.deleted_at.is_(None)).first()
    if not dispatcher:
        raise HTTPException(status_code=404, detail="Dispatcher not found")
    for k, v in payload.model_dump().items():
        setattr(dispatcher, k, v)
    db.commit()
    db.refresh(dispatcher)
    return dispatcher


@router.delete("/{dispatcher_id}", status_code=204)
def delete_dispatcher(dispatcher_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    dispatcher = db.query(models.Dispatcher).filter(models.Dispatcher.id == dispatcher_id, models.Dispatcher.deleted_at.is_(None)).first()
    if not dispatcher:
        raise HTTPException(status_code=404, detail="Dispatcher not found")
    dispatcher.deleted_at = datetime.datetime.utcnow()
    dispatcher.deleted_by = current_user.username
    db.commit()
