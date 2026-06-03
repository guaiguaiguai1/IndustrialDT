from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # CNC, Press, Conveyor, Oven, Robot
    model = Column(String(100), nullable=True)
    location = Column(String(100), nullable=False)  # Workshop name
    status = Column(String(20), nullable=False, default="online")  # online, warning, fault, offline
    health_score = Column(Float, nullable=False, default=100.0)
    installation_date = Column(DateTime, nullable=True)
    last_maintenance = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
