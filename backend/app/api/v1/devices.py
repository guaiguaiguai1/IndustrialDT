from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.device import Device

router = APIRouter(prefix="/devices", tags=["Devices"])


class DeviceResponse(BaseModel):
    id: int
    name: str
    type: str
    model: str | None
    location: str
    status: str
    health_score: float
    installation_date: datetime | None
    last_maintenance: datetime | None
    created_at: datetime | None

    class Config:
        from_attributes = True


class DeviceCreate(BaseModel):
    name: str
    type: str
    model: str | None = None
    location: str
    status: str = "online"


@router.get("/", response_model=list[DeviceResponse])
async def list_devices(
    location: Optional[str] = Query(None, description="Filter by workshop"),
    status: Optional[str] = Query(None, description="Filter by status"),
    device_type: Optional[str] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db),
):
    query = db.query(Device)
    if location:
        query = query.filter(Device.location == location)
    if status:
        query = query.filter(Device.status == status)
    if device_type:
        query = query.filter(Device.type == device_type)
    return query.order_by(Device.id).all()


@router.get("/stats")
async def device_stats(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    total = len(devices)
    online = sum(1 for d in devices if d.status == "online")
    warning = sum(1 for d in devices if d.status == "warning")
    fault = sum(1 for d in devices if d.status == "fault")
    offline = sum(1 for d in devices if d.status == "offline")
    avg_health = sum(d.health_score for d in devices) / total if total > 0 else 0

    return {
        "total": total,
        "online": online,
        "warning": warning,
        "fault": fault,
        "offline": offline,
        "avg_health_score": round(avg_health, 1),
    }


@router.get("/workshops")
async def list_workshops(db: Session = Depends(get_db)):
    workshops = db.query(Device.location).distinct().all()
    return [w[0] for w in workshops]


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.post("/", response_model=DeviceResponse)
async def create_device(device_data: DeviceCreate, db: Session = Depends(get_db)):
    device = Device(**device_data.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: int, device_data: DeviceCreate, db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for key, value in device_data.model_dump().items():
        setattr(device, key, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}")
async def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted successfully"}
