"""Tests for dashboard endpoints."""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.alert import Alert
from app.models.telemetry import TelemetryData


def _create_devices_with_data(db: Session):
    """Create test devices with telemetry and alerts."""
    devices = [
        Device(name="CNC #1", type="CNC Machine", location="Workshop A", status="online", health_score=95.0),
        Device(name="Press #1", type="Hydraulic Press", location="Workshop B", status="warning", health_score=70.0),
        Device(name="Oven #1", type="Industrial Oven", location="Workshop C", status="offline", health_score=30.0),
    ]
    db.add_all(devices)
    db.commit()
    for d in devices:
        db.refresh(d)

    now = datetime.now(timezone.utc)
    for device in devices:
        for i in range(3):
            db.add(
                TelemetryData(
                    device_id=device.id,
                    timestamp=now - timedelta(hours=i),
                    temperature=50.0 + i,
                    vibration=3.0,
                    current=20.0,
                    pressure=4.0,
                    rpm=1800.0,
                    power_consumption=25.0,
                )
            )

    db.add(
        Alert(
            device_id=devices[0].id,
            type="temperature",
            severity="warning",
            message="High temperature on CNC #1",
            resolved=False,
        )
    )
    db.commit()
    return devices


class TestDashboardOverview:
    def test_overview_empty(self, client: TestClient, db: Session):
        resp = client.get("/api/v1/dashboard/overview")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_devices"] == 0

    def test_overview_with_devices(self, client: TestClient, db: Session):
        _create_devices_with_data(db)
        resp = client.get("/api/v1/dashboard/overview")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_devices"] == 3
        assert data["online"] == 1
        assert data["warning"] == 1
        assert data["offline"] == 1
        assert data["active_alerts"] == 1
        assert "avg_health_score" in data
        assert "status_distribution" in data


class TestOEEStats:
    def test_oee_empty(self, client: TestClient, db: Session):
        resp = client.get("/api/v1/dashboard/oee")
        assert resp.status_code == 200
        data = resp.json()
        assert data["oee"] == 0

    def test_oee_with_data(self, client: TestClient, db: Session):
        _create_devices_with_data(db)
        resp = client.get("/api/v1/dashboard/oee")
        assert resp.status_code == 200
        data = resp.json()
        assert "oee" in data
        assert "availability" in data
        assert "performance" in data
        assert "quality" in data
        assert 0 <= data["availability"] <= 100


class TestOEETrend:
    def test_oee_trend(self, client: TestClient, db: Session):
        resp = client.get("/api/v1/dashboard/oee/trend")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 30
        for entry in data:
            assert "date" in entry
            assert "oee" in entry
            assert "availability" in entry
            assert "performance" in entry
            assert "quality" in entry


class TestDashboardDevices:
    def test_dashboard_devices_empty(self, client: TestClient, db: Session):
        resp = client.get("/api/v1/dashboard/devices")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_dashboard_devices_with_data(self, client: TestClient, db: Session):
        _create_devices_with_data(db)
        resp = client.get("/api/v1/dashboard/devices")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        for item in data:
            assert "id" in item
            assert "name" in item
            assert "status" in item
            assert "health_score" in item
            assert "temperature" in item
            assert "vibration" in item
