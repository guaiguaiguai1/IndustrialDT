from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.core.database import get_db
from app.models.device import Device
from app.models.alert import Alert
from app.models.telemetry import TelemetryData

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def dashboard_overview(db: Session = Depends(get_db)):
    """Main dashboard data with KPIs."""
    devices = db.query(Device).all()
    total = len(devices)
    online = sum(1 for d in devices if d.status == "online")
    warning = sum(1 for d in devices if d.status == "warning")
    fault = sum(1 for d in devices if d.status == "fault")
    offline = sum(1 for d in devices if d.status == "offline")

    active_alerts = db.query(Alert).filter(Alert.resolved == False).count()
    avg_health = sum(d.health_score for d in devices) / total if total > 0 else 0

    return {
        "total_devices": total,
        "online": online,
        "warning": warning,
        "fault": fault,
        "offline": offline,
        "active_alerts": active_alerts,
        "avg_health_score": round(avg_health, 1),
        "status_distribution": {
            "online": online,
            "warning": warning,
            "fault": fault,
            "offline": offline,
        },
    }


@router.get("/oee")
async def oee_stats(db: Session = Depends(get_db)):
    """Overall Equipment Effectiveness statistics."""
    import random

    # Simulated OEE based on device data
    devices = db.query(Device).all()
    online_count = sum(1 for d in devices if d.status in ("online", "warning"))

    availability = round(85 + (online_count / max(len(devices), 1)) * 14, 1)
    performance = round(80 + random.uniform(0, 15), 1)
    quality = round(92 + random.uniform(0, 7), 1)
    oee = round(availability * performance * quality / 10000, 1)

    return {
        "oee": oee,
        "availability": availability,
        "performance": performance,
        "quality": quality,
    }


@router.get("/oee/trend")
async def oee_trend():
    """OEE trend for the last 30 days."""
    import random

    result = []
    for i in range(29, -1, -1):
        day = datetime.now(timezone.utc).date() - timedelta(days=i)
        availability = round(85 + random.uniform(0, 14), 1)
        performance = round(80 + random.uniform(0, 15), 1)
        quality = round(92 + random.uniform(0, 7), 1)
        oee = round(availability * performance * quality / 10000, 1)
        result.append({
            "date": day.isoformat(),
            "oee": oee,
            "availability": availability,
            "performance": performance,
            "quality": quality,
        })
    return result


@router.get("/devices")
async def device_list_dashboard(db: Session = Depends(get_db)):
    """Device list with latest telemetry for dashboard."""
    devices = db.query(Device).all()
    result = []
    for d in devices:
        latest = (
            db.query(TelemetryData)
            .filter(TelemetryData.device_id == d.id)
            .order_by(TelemetryData.timestamp.desc())
            .first()
        )
        result.append({
            "id": d.id,
            "name": d.name,
            "type": d.type,
            "location": d.location,
            "status": d.status,
            "health_score": d.health_score,
            "temperature": latest.temperature if latest else None,
            "vibration": latest.vibration if latest else None,
        })
    return result
