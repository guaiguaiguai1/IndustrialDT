import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel

from app.core.database import get_db
from app.models.telemetry import TelemetryData
from app.models.device import Device
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


class TelemetryResponse(BaseModel):
    id: int
    device_id: int
    timestamp: datetime
    temperature: float
    vibration: float
    current: float
    pressure: float
    rpm: float
    power_consumption: float | None

    class Config:
        from_attributes = True


@router.get("/{device_id}", response_model=list[TelemetryResponse])
async def get_device_telemetry(
    device_id: int,
    hours: int = Query(24, description="Number of hours of data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    return (
        db.query(TelemetryData)
        .filter(TelemetryData.device_id == device_id, TelemetryData.timestamp >= cutoff)
        .order_by(TelemetryData.timestamp)
        .all()
    )


@router.get("/{device_id}/latest")
async def get_latest_telemetry(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = (
        db.query(TelemetryData)
        .filter(TelemetryData.device_id == device_id)
        .order_by(TelemetryData.timestamp.desc())
        .first()
    )
    if not data:
        return {
            "temperature": round(random.uniform(20, 80), 1),
            "vibration": round(random.uniform(0.5, 8.0), 2),
            "current": round(random.uniform(10, 40), 1),
            "pressure": round(random.uniform(2, 8), 1),
            "rpm": round(random.uniform(800, 3000), 0),
            "power_consumption": round(random.uniform(5, 50), 1),
        }
    return data


@router.post("/simulate")
async def simulate_telemetry(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate simulated real-time telemetry for all devices."""
    devices = db.query(Device).all()
    now = datetime.now(timezone.utc)
    new_records = []

    for device in devices:
        base_temp = {"CNC Machine": 55, "Hydraulic Press": 70, "Conveyor": 35, "Industrial Oven": 180, "Robotic Arm": 42}
        base = base_temp.get(device.type, 50)

        temp = round(base + random.uniform(-10, 15), 1)
        vibration = round(random.uniform(0.5, 12.0), 2)
        current_val = round(random.uniform(8, 45), 1)
        pressure = round(random.uniform(2, 9), 1)
        rpm = round(random.uniform(500, 3500), 0)
        power = round(random.uniform(5, 60), 1)

        record = TelemetryData(
            device_id=device.id,
            timestamp=now,
            temperature=temp,
            vibration=vibration,
            current=current_val,
            pressure=pressure,
            rpm=rpm,
            power_consumption=power,
        )
        new_records.append(record)

    db.add_all(new_records)
    db.commit()
    return {"message": f"Generated telemetry for {len(devices)} devices", "timestamp": now.isoformat()}


@router.get("/realtime/all")
async def get_realtime_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get latest telemetry for all devices (for 3D view, optimized, no N+1)."""
    # Subquery: latest timestamp per device
    latest_subq = (
        db.query(
            TelemetryData.device_id,
            sqlfunc.max(TelemetryData.timestamp).label("max_ts"),
        )
        .group_by(TelemetryData.device_id)
        .subquery()
    )

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
    for device, data in rows:
        if data:
            result.append({
                "device_id": device.id,
                "device_name": device.name,
                "status": device.status,
                "health_score": device.health_score,
                "temperature": data.temperature,
                "vibration": data.vibration,
                "current": data.current,
                "pressure": data.pressure,
                "rpm": data.rpm,
                "power_consumption": data.power_consumption,
                "timestamp": data.timestamp.isoformat(),
            })
    return result
