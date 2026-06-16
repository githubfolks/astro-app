from sqlalchemy.orm import Session
from typing import Optional
from . import models


def log(
    db: Session,
    action: str,
    actor_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
):
    entry = models.AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=details,
    )
    db.add(entry)
    # Caller is responsible for db.commit()
