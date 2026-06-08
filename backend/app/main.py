from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, devices, telemetry, alerts, maintenance, dashboard, analytics, websocket
from app.seed.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="IoT-powered digital twin platform for manufacturing equipment monitoring",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(websocket.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
