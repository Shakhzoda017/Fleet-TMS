import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB


@router.get("", response_model=list[schemas.DocumentOut])
def list_documents(entity_type: str, entity_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Document)
        .filter(models.Document.entity_type == entity_type, models.Document.entity_id == entity_id)
        .order_by(models.Document.uploaded_at.desc())
        .all()
    )


@router.post("", response_model=schemas.DocumentOut)
async def upload_document(
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    label: str = Form(...),
    number: str | None = Form(None),
    state: str | None = Form(None),
    issue_date: str | None = Form(None),
    exp_date: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type {ext!r}")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 15 MB)")

    stored_name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / stored_name).write_bytes(contents)

    doc = models.Document(
        entity_type=entity_type,
        entity_id=entity_id,
        label=label,
        file_path=f"/uploads/{stored_name}",
        original_filename=file.filename or stored_name,
        number=number,
        state=state,
        issue_date=issue_date,
        exp_date=exp_date,
        uploaded_by=current_user.username,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    file_path = UPLOAD_DIR / Path(doc.file_path).name
    if file_path.exists():
        file_path.unlink()
    db.delete(doc)
    db.commit()
