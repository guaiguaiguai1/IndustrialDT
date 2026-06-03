from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class TelemetryData(Base):
    __tablename__ = "telemetry_data"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    temperature = Column(Float, nullable=False)  # Celsius
    vibration = Column(Float, nullable=False)  # mm/s
    current = Column(Float, nullable=False)  # Amperes
    pressure = Column(Float, nullable=False)  # bar
    rpm = Column(Float, nullable=False)  # rotations per minute
    power_consumption = Column(Float, nullable=True)  # kW
    created_at = Column(DateTime, server_default=func.now())
