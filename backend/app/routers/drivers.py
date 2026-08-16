import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import audit, models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("", response_model=list[schemas.DriverOut])
def list_drivers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Driver)
        .options(joinedload(models.Driver.truck))
        .filter(models.Driver.deleted_at.is_(None))
        .all()
    )


@router.get("/{driver_id}", response_model=schemas.DriverOut)
def get_driver(driver_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    driver = (
        db.query(models.Driver)
        .options(joinedload(models.Driver.truck))
        .filter(models.Driver.id == driver_id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.post("", response_model=schemas.DriverOut)
def create_driver(
    payload: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    driver = models.Driver(**payload.model_dump())
    db.add(driver)
    db.flush()
    db.add(models.DriverStatusPeriod(driver_id=driver.id, status=driver.status))
    audit.record(db, "driver", driver.id, current_user.username, "created", f"name={driver.name!r}")
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/archive", response_model=list[schemas.DriverOut])
def list_archived_drivers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Driver).filter(models.Driver.deleted_at.isnot(None)).all()


@router.post("/archive/{driver_id}/restore", response_model=schemas.DriverOut)
def restore_driver(
    driver_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    driver.deleted_at = None
    driver.deleted_by = None
    audit.record(db, "driver", driver.id, current_user.username, "restored")
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/archive/{driver_id}", status_code=204)
def permanently_delete_driver(driver_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(driver)
    db.commit()


def _track_status_change(db: Session, driver: models.Driver, new_status: str):
    if new_status == driver.status:
        return
    now = datetime.datetime.utcnow()
    open_period = (
        db.query(models.DriverStatusPeriod)
        .filter(models.DriverStatusPeriod.driver_id == driver.id, models.DriverStatusPeriod.ended_at.is_(None))
        .first()
    )
    if open_period:
        open_period.ended_at = now
    db.add(models.DriverStatusPeriod(driver_id=driver.id, status=new_status, started_at=now))
    driver.status = new_status


@router.patch("/{driver_id}/status", response_model=schemas.DriverOut)
def update_driver_status(
    driver_id: int,
    payload: schemas.StatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id, models.Driver.deleted_at.is_(None)).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    old_status = driver.status
    _track_status_change(db, driver, payload.status)
    audit.record(db, "driver", driver.id, current_user.username, "updated", f"status: {old_status!r} -> {payload.status!r}")
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/{driver_id}/status-history", response_model=list[schemas.DriverStatusPeriodOut])
def driver_status_history(driver_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.DriverStatusPeriod)
        .filter(models.DriverStatusPeriod.driver_id == driver_id)
        .order_by(models.DriverStatusPeriod.started_at.desc())
        .all()
    )


@router.put("/{driver_id}", response_model=schemas.DriverOut)
def update_driver(
    driver_id: int,
    payload: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id, models.Driver.deleted_at.is_(None)).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    before = {c: getattr(driver, c) for c in payload.model_dump().keys()}
    new_status = payload.status

    for k, v in payload.model_dump().items():
        if k != "status":
            setattr(driver, k, v)
    _track_status_change(db, driver, new_status)

    audit.record(db, "driver", driver.id, current_user.username, "updated", audit.diff_summary(before, payload.model_dump()))
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=204)
def delete_driver(driver_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id, models.Driver.deleted_at.is_(None)).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    driver.deleted_at = datetime.datetime.utcnow()
    driver.deleted_by = current_user.username
    audit.record(db, "driver", driver.id, current_user.username, "deleted")
    db.commit()
