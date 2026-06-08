from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.core.database import get_db
from app.models.maintenance import MaintenanceRecord
from app.models.device import Device
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


class MaintenanceResponse(BaseModel):
    id: int
    device_id: int
    device_name: str | None = None
    type: str
    description: str
    start_time: datetime
    end_time: datetime | None
    status: str
    technician: str | None
    cost: float | None
    notes: str | None
    created_at: datetime | None

    class Config:
        from_attributes = True


class MaintenanceCreate(BaseModel):
    device_id: int
    type: str
    description: str
    start_time: datetime
    end_time: datetime | None = None
    status: str = "scheduled"
    technician: str | None = None
    cost: float | None = None
    notes: str | None = None


@router.get("/", response_model=list[MaintenanceResponse])
async def list_maintenance(
    device_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MaintenanceRecord).options(joinedload(MaintenanceRecord.device))
    if device_id:
        query = query.filter(MaintenanceRecord.device_id == device_id)
    if status:
        query = query.filter(MaintenanceRecord.status == status)
    records = query.order_by(MaintenanceRecord.start_time.desc()).all()

    result = []
    for record in records:
        result.append(
            MaintenanceResponse(
                id=record.id,
                device_id=record.device_id,
                device_name=record.device.name if record.device else None,
                type=record.type,
                description=record.description,
                start_time=record.start_time,
                end_time=record.end_time,
                status=record.status,
                technician=record.technician,
                cost=float(record.cost) if record.cost else None,
                notes=record.notes,
                created_at=record.created_at,
            )
        )
    return result


@router.get("/calendar")
async def maintenance_calendar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get maintenance events formatted for calendar display."""
    records = db.query(MaintenanceRecord).options(joinedload(MaintenanceRecord.device)).all()
    events = []
    for r in records:
        events.append({
            "id": r.id,
            "title": f"{r.type.title()} - {r.device.name if r.device else 'Unknown'}",
            "start": r.start_time.isoformat(),
            "end": r.end_time.isoformat() if r.end_time else r.start_time.isoformat(),
            "status": r.status,
            "type": r.type,
            "device_name": r.device.name if r.device else None,
        })
    return events


@router.post("/", response_model=MaintenanceResponse)
async def create_maintenance(
    data: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = MaintenanceRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    # Load with device relationship
    record = db.query(MaintenanceRecord).options(joinedload(MaintenanceRecord.device)).filter(MaintenanceRecord.id == record.id).first()
    return MaintenanceResponse(
        id=record.id,
        device_id=record.device_id,
        device_name=record.device.name if record.device else None,
        type=record.type,
        description=record.description,
        start_time=record.start_time,
        end_time=record.end_time,
        status=record.status,
        technician=record.technician,
        cost=float(record.cost) if record.cost else None,
        notes=record.notes,
        created_at=record.created_at,
    )


@router.put("/{record_id}")
async def update_maintenance_status(
    record_id: int,
    status: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    record.status = status
    if status == "completed":
        record.end_time = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Maintenance record updated", "id": record_id}
