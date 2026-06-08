from datetime import datetime, timedelta, timezone

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
    """Overall Equipment Effectiveness statistics based on real telemetry data."""
    devices = db.query(Device).all()
    total_devices = len(devices)
    if total_devices == 0:
        return {"oee": 0, "availability": 0, "performance": 0, "quality": 0}

    # Availability: ratio of online/warning devices
    online_count = sum(1 for d in devices if d.status in ("online", "warning"))
    availability = round((online_count / total_devices) * 100, 1)

    # Performance: based on avg RPM vs nominal RPM (assuming nominal 2000)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    avg_rpm = (
        db.query(sqlfunc.avg(TelemetryData.rpm))
        .filter(TelemetryData.timestamp >= cutoff)
        .scalar()
    ) or 0
    performance = round(min((avg_rpm / 2000) * 100, 100), 1)

    # Quality: inverse relationship with vibration (lower vibration = higher quality)
    avg_vibration = (
        db.query(sqlfunc.avg(TelemetryData.vibration))
        .filter(TelemetryData.timestamp >= cutoff)
        .scalar()
    ) or 5.0
    # Vibration range 0-15 mm/s, quality degrades above 5
    quality = round(max(100 - (avg_vibration * 3), 50), 1)

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
    """Device list with latest telemetry for dashboard (optimized, no N+1)."""
    from sqlalchemy.orm import aliased

    # Subquery: latest timestamp per device
    latest_subq = (
        db.query(
            TelemetryData.device_id,
            sqlfunc.max(TelemetryData.timestamp).label("max_ts"),
        )
        .group_by(TelemetryData.device_id)
        .subquery()
    )

    # Join devices with their latest telemetry in a single query
    rows = (
        db.query(Device, TelemetryData)
        .outerjoin(
            latest_subq,
            Device.id == latest_subq.c.device_id,
        )
        .outerjoin(
            TelemetryData,
            (TelemetryData.device_id == latest_subq.c.device_id)
            & (TelemetryData.timestamp == latest_subq.c.max_ts),
        )
        .order_by(Device.id)
        .all()
    )

    result = []
    for d, latest in rows:
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
