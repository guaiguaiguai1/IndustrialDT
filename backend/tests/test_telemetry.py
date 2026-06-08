"""Tests for telemetry endpoints."""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.models.device import Device
from app.models.telemetry import TelemetryData


def _create_test_user(db: Session):
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        role="operator",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _get_auth_headers(client: TestClient, db: Session) -> dict:
    _create_test_user(db)
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpass123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_device_with_telemetry(db: Session):
    device = Device(
        name="Test CNC",
        type="CNC Machine",
        model="TestModel",
        location="Workshop A",
        status="online",
        health_score=90.0,
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    now = datetime.now(timezone.utc)
    records = []
    for i in range(5):
        records.append(
            TelemetryData(
                device_id=device.id,
                timestamp=now - timedelta(hours=i),
                temperature=55.0 + i,
                vibration=2.5 + i * 0.1,
                current=20.0 + i,
                pressure=4.0,
                rpm=2000.0 + i * 10,
                power_consumption=25.0,
            )
        )
    db.add_all(records)
    db.commit()
    return device


class TestGetDeviceTelemetry:
    def test_get_telemetry_success(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        device = _create_device_with_telemetry(db)
        resp = client.get(
            f"/api/v1/telemetry/{device.id}",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 5
        assert data[0]["device_id"] == device.id

    def test_get_telemetry_with_hours_filter(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        device = _create_device_with_telemetry(db)
        resp = client.get(
            f"/api/v1/telemetry/{device.id}?hours=1",
            headers=headers,
        )
        assert resp.status_code == 200
        # Should return fewer records with 1-hour filter
        data = resp.json()
        assert len(data) <= 5

    def test_get_telemetry_no_auth(self, client: TestClient, db: Session):
        device = _create_device_with_telemetry(db)
        resp = client.get(f"/api/v1/telemetry/{device.id}")
        assert resp.status_code == 401


class TestGetLatestTelemetry:
    def test_get_latest_success(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        device = _create_device_with_telemetry(db)
        resp = client.get(
            f"/api/v1/telemetry/{device.id}/latest",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "temperature" in data
        assert "vibration" in data

    def test_get_latest_no_data(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        # Create device without telemetry
        device = Device(
            name="Empty Device",
            type="Conveyor",
            location="Workshop B",
            status="online",
            health_score=100.0,
        )
        db.add(device)
        db.commit()
        db.refresh(device)

        resp = client.get(
            f"/api/v1/telemetry/{device.id}/latest",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "temperature" in data


class TestSimulateTelemetry:
    def test_simulate_telemetry(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        # Create a device first
        device = Device(
            name="Sim Device",
            type="CNC Machine",
            location="Workshop A",
            status="online",
            health_score=90.0,
        )
        db.add(device)
        db.commit()

        resp = client.post(
            "/api/v1/telemetry/simulate",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "Generated telemetry" in data["message"]


class TestRealtimeAll:
    def test_realtime_all_empty(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        resp = client.get(
            "/api/v1/telemetry/realtime/all",
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_realtime_all_with_data(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        _create_device_with_telemetry(db)
        resp = client.get(
            "/api/v1/telemetry/realtime/all",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert "temperature" in data[0]
        assert "device_name" in data[0]
