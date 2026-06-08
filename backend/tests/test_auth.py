"""Tests for authentication endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User


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


class TestLogin:
    def test_login_success(self, client: TestClient, db: Session):
        _create_test_user(db)
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "testpass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client: TestClient, db: Session):
        _create_test_user(db)
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client: TestClient, db: Session):
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "nouser", "password": "testpass123"},
        )
        assert response.status_code == 401

    def test_login_missing_fields(self, client: TestClient, db: Session):
        response = client.post("/api/v1/auth/login", data={})
        assert response.status_code == 422


class TestGetMe:
    def test_get_me_authenticated(self, client: TestClient, db: Session):
        _create_test_user(db)
        login_resp = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "testpass123"},
        )
        token = login_resp.json()["access_token"]

        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert data["role"] == "operator"

    def test_get_me_no_token(self, client: TestClient, db: Session):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client: TestClient, db: Session):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert response.status_code == 401
