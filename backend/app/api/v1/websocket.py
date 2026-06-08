"""WebSocket endpoint for real-time telemetry push."""

import asyncio
import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.core.database import get_db
from app.core.security import decode_token
from app.models.device import Device
from app.models.telemetry import TelemetryData

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass


manager = ConnectionManager()


def _get_latest_telemetry(db: Session) -> list[dict]:
    """Fetch latest telemetry for all devices in a single query."""
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
        .outerjoin(latest_subq, Device.id == latest_subq.c.device_id)
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


@router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket, token: str = ""):
    """
    WebSocket endpoint for real-time telemetry streaming.

    Connect with: ws://host:port/api/v1/ws/telemetry?token=<jwt_token>

    Sends telemetry data every 3 seconds to authenticated clients.
    """
    # Authenticate via query param token
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket)
    try:
        # Send telemetry updates every 3 seconds
        while True:
            # Use a new DB session for each iteration
            from app.core.database import SessionLocal
            db = SessionLocal()
            try:
                data = _get_latest_telemetry(db)
            finally:
                db.close()

            await websocket.send_json({
                "type": "telemetry_update",
                "data": data,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
