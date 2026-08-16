import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/trucks", tags=["trucks"])


@router.get("", response_model=list[schemas.TruckOut])
def list_trucks(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Truck).filter(models.Truck.deleted_at.is_(None)).all()


@router.post("", response_model=schemas.TruckOut)
def create_truck(payload: schemas.TruckCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    truck = models.Truck(**payload.model_dump())
    db.add(truck)
    db.commit()
    db.refresh(truck)
    return truck


@router.get("/archive", response_model=list[schemas.TruckOut])
def list_archived_trucks(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Truck).filter(models.Truck.deleted_at.isnot(None)).all()


@router.post("/archive/{truck_id}/restore", response_model=schemas.TruckOut)
def restore_truck(truck_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    truck = db.query(models.Truck).filter(models.Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    truck.deleted_at = None
    truck.deleted_by = None
    db.commit()
    db.refresh(truck)
    return truck


@router.delete("/archive/{truck_id}", status_code=204)
def permanently_delete_truck(truck_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    truck = db.query(models.Truck).filter(models.Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    db.delete(truck)
    db.commit()


@router.put("/{truck_id}", response_model=schemas.TruckOut)
def update_truck(truck_id: int, payload: schemas.TruckCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    truck = db.query(models.Truck).filter(models.Truck.id == truck_id, models.Truck.deleted_at.is_(None)).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    for k, v in payload.model_dump().items():
        setattr(truck, k, v)
    db.commit()
    db.refresh(truck)
    return truck


@router.delete("/{truck_id}", status_code=204)
def delete_truck(truck_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    truck = db.query(models.Truck).filter(models.Truck.id == truck_id, models.Truck.deleted_at.is_(None)).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    truck.deleted_at = datetime.datetime.utcnow()
    truck.deleted_by = current_user.username
    db.commit()
