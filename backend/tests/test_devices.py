"""Tests for device CRUD endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.models.device import Device


def _create_test_user(db: Session):
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        role="admin",
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


def _create_test_device(db: Session) -> Device:
    device = Device(
        name="Test CNC #1",
        type="CNC Machine",
        model="TestModel X1",
        location="Workshop A",
        status="online",
        health_score=95.0,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


class TestListDevices:
    def test_list_devices_empty(self, client: TestClient, db: Session):
        resp = client.get("/api/v1/devices/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_devices_with_data(self, client: TestClient, db: Session):
        _create_test_device(db)
        resp = client.get("/api/v1/devices/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test CNC #1"

    def test_list_devices_filter_by_status(self, client: TestClient, db: Session):
        _create_test_device(db)
        resp = client.get("/api/v1/devices/?status=online")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

        resp = client.get("/api/v1/devices/?status=fault")
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_list_devices_filter_by_location(self, client: TestClient, db: Session):
        _create_test_device(db)
        resp = client.get("/api/v1/devices/?location=Workshop A")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_list_devices_filter_by_type(self, client: TestClient, db: Session):
        _create_test_device(db)
        resp = client.get("/api/v1/devices/?device_type=CNC Machine")
        assert resp.status_code == 200
        assert len(resp.json()) == 1


class TestGetDevice:
    def test_get_device_success(self, client: TestClient, db: Session):
        device = _create_test_device(db)
        resp = client.get(f"/api/v1/devices/{device.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test CNC #1"

    def test_get_device_not_found(self, client: TestClient, db: Session):
        resp = client.get("/api/v1/devices/9999")
        assert resp.status_code == 404


class TestCreateDevice:
    def test_create_device_success(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        resp = client.post(
            "/api/v1/devices/",
            json={
                "name": "New Robot",
                "type": "Robotic Arm",
                "location": "Workshop B",
                "status": "online",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "New Robot"
        assert data["type"] == "Robotic Arm"

    def test_create_device_invalid_type(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        resp = client.post(
            "/api/v1/devices/",
            json={
                "name": "Bad Device",
                "type": "InvalidType",
                "location": "Workshop A",
            },
            headers=headers,
        )
        assert resp.status_code == 422

    def test_create_device_invalid_status(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        resp = client.post(
            "/api/v1/devices/",
            json={
                "name": "Bad Device",
                "type": "CNC Machine",
                "location": "Workshop A",
                "status": "invalid_status",
            },
            headers=headers,
        )
        assert resp.status_code == 422

    def test_create_device_no_auth(self, client: TestClient, db: Session):
        resp = client.post(
            "/api/v1/devices/",
            json={
                "name": "No Auth Device",
                "type": "CNC Machine",
                "location": "Workshop A",
            },
        )
        assert resp.status_code == 401


class TestUpdateDevice:
    def test_update_device_success(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        device = _create_test_device(db)
        resp = client.put(
            f"/api/v1/devices/{device.id}",
            json={
                "name": "Updated CNC",
                "type": "CNC Machine",
                "location": "Workshop C",
                "status": "warning",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated CNC"
        assert resp.json()["status"] == "warning"

    def test_update_device_not_found(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        resp = client.put(
            "/api/v1/devices/9999",
            json={
                "name": "Ghost",
                "type": "CNC Machine",
                "location": "Workshop A",
            },
            headers=headers,
        )
        assert resp.status_code == 404


class TestDeleteDevice:
    def test_delete_device_success(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        device = _create_test_device(db)
        resp = client.delete(f"/api/v1/devices/{device.id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["message"] == "Device deleted successfully"

        # Verify deletion
        resp = client.get(f"/api/v1/devices/{device.id}")
        assert resp.status_code == 404

    def test_delete_device_not_found(self, client: TestClient, db: Session):
        headers = _get_auth_headers(client, db)
        resp = client.delete("/api/v1/devices/9999", headers=headers)
        assert resp.status_code == 404


class TestDeviceStats:
    def test_device_stats(self, client: TestClient, db: Session):
        _create_test_device(db)
        resp = client.get("/api/v1/devices/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["online"] == 1
        assert data["warning"] == 0
        assert "avg_health_score" in data


class TestWorkshops:
    def test_list_workshops(self, client: TestClient, db: Session):
        _create_test_device(db)
        resp = client.get("/api/v1/devices/workshops")
        assert resp.status_code == 200
        assert "Workshop A" in resp.json()
