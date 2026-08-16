import mimetypes
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB


@router.get("/summary")
def documents_summary(entity_type: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Lightweight (entity_id, label) pairs for a whole entity type, so list
    views can show a has-document indicator without an N+1 request per row."""
    rows = (
        db.query(models.Document.entity_id, models.Document.label)
        .filter(models.Document.entity_type == entity_type)
        .all()
    )
    return [{"entity_id": r[0], "label": r[1]} for r in rows]


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

    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"

    doc = models.Document(
        entity_type=entity_type,
        entity_id=entity_id,
        label=label,
        content=contents,
        content_type=content_type,
        original_filename=file.filename or "document",
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


@router.get("/{document_id}/file")
def download_document(document_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return Response(
        content=doc.content,
        media_type=doc.content_type,
        headers={"Content-Disposition": f'inline; filename="{doc.original_filename}"'},
    )


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
