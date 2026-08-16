from sqlalchemy.orm import Session

from . import models


def record(db: Session, entity_type: str, entity_id: int, staff: str, action: str, differences: str = ""):
    db.add(
        models.AuditLogEntry(
            entity_type=entity_type,
            entity_id=entity_id,
            staff=staff,
            action=action,
            differences=differences,
        )
    )


def diff_summary(before: dict, after: dict) -> str:
    changes = []
    for key, new_val in after.items():
        old_val = before.get(key)
        if old_val != new_val:
            changes.append(f"{key}: {old_val!r} -> {new_val!r}")
    return "; ".join(changes) if changes else "no field changes"
