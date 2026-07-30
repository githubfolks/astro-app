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
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    final_details = details.copy() if details else {}
    if client_ip:
        final_details["client_ip"] = client_ip
    if user_agent:
        final_details["user_agent"] = user_agent

    entry = models.AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        details=final_details if final_details else None,
    )
    db.add(entry)
    # Caller is responsible for db.commit()

