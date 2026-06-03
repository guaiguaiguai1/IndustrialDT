import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.device import Device
from app.models.telemetry import TelemetryData
from app.models.alert import Alert
from app.models.maintenance import MaintenanceRecord
from app.models.user import User


def seed_database():
    """Seed the database with realistic industrial data."""
    db = SessionLocal()

    # Check if already seeded
    if db.query(Device).count() > 0:
        print("Database already seeded, skipping.")
        db.close()
        return

    print("Seeding database...")

    # --- Users ---
    users = [
        User(
            username="admin",
            email="admin@industrial-dt.com",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            role="admin",
        ),
        User(
            username="engineer",
            email="engineer@industrial-dt.com",
            hashed_password=get_password_hash("engineer123"),
            full_name="Zhang Wei",
            role="engineer",
        ),
        User(
            username="operator",
            email="operator@industrial-dt.com",
            hashed_password=get_password_hash("operator123"),
            full_name="Li Ming",
            role="operator",
        ),
    ]
    db.add_all(users)
    db.commit()
    print(f"  Created {len(users)} users")

    # --- Devices ---
    workshop_a = "Workshop A - Machining"
    workshop_b = "Workshop B - Assembly"
    workshop_c = "Workshop C - Heat Treatment"

    devices_data = [
        # Workshop A - Machining
        {"name": "CNC Lathe #1", "type": "CNC Machine", "model": "DMG MORI CLX 350", "location": workshop_a, "status": "online", "health_score": 94.5},
        {"name": "CNC Mill #2", "type": "CNC Machine", "model": "Haas VF-2SS", "location": workshop_a, "status": "online", "health_score": 91.2},
        {"name": "CNC Lathe #3", "type": "CNC Machine", "model": "Okuma LB3000", "location": workshop_a, "status": "warning", "health_score": 72.8},
        {"name": "CNC Router #4", "type": "CNC Machine", "model": "ShopBot PRSalpha", "location": workshop_a, "status": "online", "health_score": 88.6},
        {"name": "Conveyor Belt A1", "type": "Conveyor", "model": "Hytrol EZLogic", "location": workshop_a, "status": "online", "health_score": 96.1},
        # Workshop B - Assembly
        {"name": "Hydraulic Press #1", "type": "Hydraulic Press", "model": "Beckwood 150T", "location": workshop_b, "status": "online", "health_score": 89.3},
        {"name": "Hydraulic Press #2", "type": "Hydraulic Press", "model": "Dake 100T", "location": workshop_b, "status": "fault", "health_score": 45.2},
        {"name": "Robotic Arm #1", "type": "Robotic Arm", "model": "Fanuc M-20iD", "location": workshop_b, "status": "online", "health_score": 97.0},
        {"name": "Robotic Arm #2", "type": "Robotic Arm", "model": "ABB IRB 6700", "location": workshop_b, "status": "online", "health_score": 93.5},
        {"name": "Conveyor Belt B1", "type": "Conveyor", "model": "Dorner 3200", "location": workshop_b, "status": "warning", "health_score": 68.4},
        {"name": "Assembly Station #1", "type": "Robotic Arm", "model": "KUKA KR 210", "location": workshop_b, "status": "online", "health_score": 90.1},
        # Workshop C - Heat Treatment
        {"name": "Industrial Oven #1", "type": "Industrial Oven", "model": "Despatch RAD", "location": workshop_c, "status": "online", "health_score": 85.7},
        {"name": "Industrial Oven #2", "type": "Industrial Oven", "model": "Grieve ABF-500", "location": workshop_c, "status": "online", "health_score": 92.3},
        {"name": "Conveyor Belt C1", "type": "Conveyor", "model": "Intralox S1100", "location": workshop_c, "status": "offline", "health_score": 30.0},
        {"name": "CNC EDM #5", "type": "CNC Machine", "model": "Mitsubishi MV-1200S", "location": workshop_c, "status": "online", "health_score": 87.9},
        {"name": "Robotic Arm #3", "type": "Robotic Arm", "model": "Universal Robots UR10e", "location": workshop_c, "status": "online", "health_score": 95.2},
    ]

    base_date = datetime(2024, 1, 1)
    devices = []
    for d in devices_data:
        device = Device(
            name=d["name"],
            type=d["type"],
            model=d["model"],
            location=d["location"],
            status=d["status"],
            health_score=d["health_score"],
            installation_date=base_date + timedelta(days=random.randint(0, 365)),
            last_maintenance=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
        )
        devices.append(device)
    db.add_all(devices)
    db.commit()
    for d in devices:
        db.refresh(d)
    print(f"  Created {len(devices)} devices")

    # --- Telemetry Data (30 days of hourly data) ---
    print("  Generating telemetry data (this may take a moment)...")
    now = datetime.utcnow()
    telemetry_records = []

    for device in devices:
        # Base values depend on device type
        type_params = {
            "CNC Machine": {"temp": (45, 75), "vib": (1, 8), "curr": (15, 40), "press": (3, 7), "rpm": (1500, 3500), "power": (15, 45)},
            "Hydraulic Press": {"temp": (50, 90), "vib": (2, 12), "curr": (20, 50), "press": (5, 10), "rpm": (500, 1500), "power": (25, 60)},
            "Conveyor": {"temp": (20, 45), "vib": (0.5, 4), "curr": (5, 20), "press": (1, 3), "rpm": (800, 2000), "power": (5, 20)},
            "Industrial Oven": {"temp": (80, 95), "vib": (0.5, 3), "curr": (25, 45), "press": (2, 5), "rpm": (0, 0), "power": (30, 55)},
            "Robotic Arm": {"temp": (30, 55), "vib": (0.5, 5), "curr": (10, 30), "press": (2, 6), "rpm": (500, 2500), "power": (10, 35)},
        }

        params = type_params.get(device.type, {"temp": (30, 70), "vib": (1, 6), "curr": (10, 35), "press": (3, 7), "rpm": (1000, 3000), "power": (10, 40)})

        # Add drift for degraded devices
        health_factor = device.health_score / 100.0

        for hour in range(30 * 24):
            timestamp = now - timedelta(hours=30 * 24 - hour)

            # Add some time-based variation (machines get hotter during "working hours")
            hour_of_day = timestamp.hour
            time_factor = 1.0 + 0.15 * (1 if 8 <= hour_of_day <= 18 else -0.3)

            # Degraded devices have higher readings
            degrade = 1.0 + (1 - health_factor) * 0.3

            temp = round(random.uniform(*params["temp"]) * time_factor * degrade, 1)
            vib = round(random.uniform(*params["vib"]) * degrade, 2)
            curr = round(random.uniform(*params["curr"]) * time_factor, 1)
            press = round(random.uniform(*params["press"]), 1)
            rpm = round(random.uniform(*params["rpm"]) if params["rpm"][1] > 0 else 0, 0)
            power = round(random.uniform(*params["power"]) * time_factor, 1)

            # Clamp temperature
            temp = min(temp, 99.9)

            telemetry_records.append(
                TelemetryData(
                    device_id=device.id,
                    timestamp=timestamp,
                    temperature=temp,
                    vibration=vib,
                    current=curr,
                    pressure=press,
                    rpm=rpm,
                    power_consumption=power,
                )
            )

    # Batch insert
    batch_size = 5000
    for i in range(0, len(telemetry_records), batch_size):
        db.add_all(telemetry_records[i : i + batch_size])
        db.commit()
    print(f"  Created {len(telemetry_records)} telemetry records")

    # --- Alerts ---
    alert_templates = [
        {"type": "temperature", "severity": "critical", "msg": "Temperature exceeded 90C threshold on {device}"},
        {"type": "temperature", "severity": "warning", "msg": "Temperature rising above normal on {device}"},
        {"type": "vibration", "severity": "critical", "msg": "Excessive vibration detected on {device} (>{limit}mm/s)"},
        {"type": "vibration", "severity": "warning", "msg": "Abnormal vibration pattern on {device}"},
        {"type": "pressure", "severity": "warning", "msg": "Pressure drop detected on {device}"},
        {"type": "pressure", "severity": "info", "msg": "Pressure calibration needed on {device}"},
        {"type": "maintenance", "severity": "warning", "msg": "Scheduled maintenance overdue for {device}"},
        {"type": "maintenance", "severity": "info", "msg": "Maintenance reminder: {device} due for inspection"},
        {"type": "current", "severity": "critical", "msg": "Overcurrent protection triggered on {device}"},
        {"type": "current", "severity": "warning", "msg": "Current spike detected on {device}"},
        {"type": "temperature", "severity": "info", "msg": "Temperature sensor calibration recommended for {device}"},
        {"type": "vibration", "severity": "info", "msg": "Bearing wear indicator detected on {device}"},
    ]

    alerts = []
    for i in range(25):
        template = random.choice(alert_templates)
        device = random.choice(devices)
        days_ago = random.randint(0, 14)
        hours_ago = random.randint(0, 23)
        created = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

        resolved = random.random() < 0.5
        resolved_at = created + timedelta(hours=random.randint(1, 24)) if resolved else None

        alerts.append(
            Alert(
                device_id=device.id,
                type=template["type"],
                severity=template["severity"],
                message=template["msg"].format(
                    device=device.name,
                    limit=round(random.uniform(8, 15), 1),
                ),
                resolved=resolved,
                resolved_at=resolved_at,
                created_at=created,
            )
        )
    db.add_all(alerts)
    db.commit()
    print(f"  Created {len(alerts)} alerts")

    # --- Maintenance Records ---
    technicians = ["Zhang Wei", "Li Ming", "Wang Fang", "Chen Jun", "Liu Yang"]
    maintenance_records = []

    for device in devices:
        # Past completed maintenance
        for _ in range(random.randint(0, 2)):
            start = datetime.utcnow() - timedelta(days=random.randint(10, 90))
            duration = timedelta(hours=random.randint(2, 12))
            maintenance_records.append(
                MaintenanceRecord(
                    device_id=device.id,
                    type=random.choice(["preventive", "corrective"]),
                    description=random.choice([
                        "Scheduled bearing replacement",
                        "Lubrication system service",
                        "Electrical connection inspection",
                        "Sensor calibration and testing",
                        "Belt and chain tension adjustment",
                        "Filter replacement and cleaning",
                    ]),
                    start_time=start,
                    end_time=start + duration,
                    status="completed",
                    technician=random.choice(technicians),
                    cost=random.randint(500, 5000),
                    notes="Routine maintenance completed successfully.",
                )
            )

    # Future scheduled maintenance
    for device in random.sample(devices, 8):
        future_start = datetime.utcnow() + timedelta(days=random.randint(1, 30))
        maintenance_records.append(
            MaintenanceRecord(
                device_id=device.id,
                type="preventive",
                description=random.choice([
                    "Quarterly comprehensive inspection",
                    "Annual overhaul and calibration",
                    "Predictive maintenance based on vibration analysis",
                    "Software update and system diagnostics",
                ]),
                start_time=future_start,
                end_time=future_start + timedelta(hours=random.randint(4, 8)),
                status="scheduled",
                technician=random.choice(technicians),
                cost=random.randint(1000, 8000),
            )
        )

    db.add_all(maintenance_records)
    db.commit()
    print(f"  Created {len(maintenance_records)} maintenance records")

    db.close()
    print("Database seeding complete!")
