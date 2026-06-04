from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel

from app.core.database import get_db
from app.models.alert import Alert
from app.models.device import Device
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class AlertResponse(BaseModel):
    id: int
    device_id: int
    device_name: str | None = None
    type: str
    severity: str
    message: str
    resolved: bool
    resolved_at: datetime | None
    created_at: datetime | None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    severity: Optional[str] = Query(None),
    device_id: Optional[int] = Query(None),
    resolved: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Alert).options(joinedload(Alert.device))
    if severity:
        query = query.filter(Alert.severity == severity)
    if device_id:
        query = query.filter(Alert.device_id == device_id)
    if resolved is not None:
        query = query.filter(Alert.resolved == resolved)
    alerts = query.order_by(Alert.created_at.desc()).all()

    result = []
    for alert in alerts:
        alert_dict = AlertResponse(
            id=alert.id,
            device_id=alert.device_id,
            device_name=alert.device.name if alert.device else None,
            type=alert.type,
            severity=alert.severity,
            message=alert.message,
            resolved=alert.resolved,
            resolved_at=alert.resolved_at,
            created_at=alert.created_at,
        )
        result.append(alert_dict)
    return result


@router.get("/stats")
async def alert_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Alert).count()
    unresolved = db.query(Alert).filter(Alert.resolved == False).count()
    critical = db.query(Alert).filter(Alert.severity == "critical", Alert.resolved == False).count()
    warning = db.query(Alert).filter(Alert.severity == "warning", Alert.resolved == False).count()
    info = db.query(Alert).filter(Alert.severity == "info", Alert.resolved == False).count()

    return {
        "total": total,
        "unresolved": unresolved,
        "critical": critical,
        "warning": warning,
        "info": info,
    }


@router.get("/trend")
async def alert_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alert count per day for the last 7 days."""
    from datetime import timedelta

    result = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc).date() - timedelta(days=i)
        start = datetime.combine(day, datetime.min.time())
        end = datetime.combine(day, datetime.max.time())
        count = (
            db.query(Alert)
            .filter(Alert.created_at >= start, Alert.created_at <= end)
            .count()
        )
        result.append({"date": day.isoformat(), "count": count})
    return result


@router.put("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Alert resolved", "id": alert_id}
