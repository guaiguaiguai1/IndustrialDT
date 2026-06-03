# Industrial Digital Twin Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-049EF4?logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**IoT-powered digital twin platform for manufacturing equipment monitoring, 3D visualization, predictive maintenance, and OEE analysis.**

</div>

---

## Features

- **Real-time Equipment Monitoring** - Track 16+ industrial devices across 3 workshops with live telemetry data
- **3D Workshop Visualization** - Interactive Three.js-powered 3D view with color-coded device status and click-to-inspect
- **Predictive Maintenance** - MTBF/MTTR analysis and maintenance scheduling with calendar view
- **OEE Analytics** - Overall Equipment Effectiveness breakdown (Availability x Performance x Quality)
- **Alert Management** - Real-time alert center with severity classification and resolution workflow
- **Energy Analysis** - Power consumption trends and optimization insights
- **Device Management** - Complete device lifecycle with telemetry history and health scoring

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11+** | Runtime |
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM and database toolkit |
| **SQLite** | Database |
| **Pydantic** | Data validation |
| **JWT (python-jose)** | Authentication |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Ant Design** | UI component library |
| **ECharts** | Data visualization |
| **Three.js / React Three Fiber** | 3D visualization |
| **Zustand** | State management |
| **React Router** | Client-side routing |

## Architecture

```
+-----------------------------------------------------+
|                   Frontend (React)                   |
|  +----------+  +--------+  +--------+  +---------+  |
|  | Dashboard |  | 3D View|  | Alerts |  |Analytics|  |
|  +----------+  +--------+  +--------+  +---------+  |
|       |             |           |            |        |
|  +----------------------------------------------+   |
|  |          Zustand Store + Axios API            |   |
|  +----------------------------------------------+   |
+-----------------------------------------------------+
                         |
                    REST API (HTTP)
                         |
+-----------------------------------------------------+
|                  Backend (FastAPI)                    |
|  +----------+  +--------+  +--------+  +---------+  |
|  | Auth API |  |Devices |  |Telemetry|  |Dashboard|  |
|  +----------+  +--------+  +--------+  +---------+  |
|  +----------+  +--------+  +--------+               |
|  | Alerts   |  |Maint.  |  |Analytics|               |
|  +----------+  +--------+  +--------+               |
+-----------------------------------------------------+
                         |
                  SQLAlchemy ORM
                         |
+-----------------------------------------------------+
|                    SQLite Database                    |
|  devices | telemetry_data | alerts | maintenance     |
|  users                                              |
+-----------------------------------------------------+
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-seeds database on first run)
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Default Login
| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| engineer | engineer123 | Engineer |
| operator | operator123 | Operator |

### Docker Setup

```bash
docker-compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`

## Screenshots

### Dashboard
Main monitoring dashboard with KPI cards, OEE gauge, status distribution pie chart, alert trend line chart, and device status table.

### 3D Workshop View
Interactive 3D visualization showing 16 devices across 3 workshops. Color-coded by status (green=normal, yellow=warning, red=fault, gray=offline). Click any device to view real-time telemetry in an info panel. Supports orbit controls for camera rotation.

### Device Management
Device list with filtering by workshop, status, and type. Click to view detailed telemetry charts (temperature, vibration over 48 hours).

### Alert Center
Alert management with severity badges (critical/warning/info), filtering, and one-click resolution. Statistics cards show alert distribution.

### Analytics & Reports
OEE breakdown trends, MTBF/MTTR reliability statistics, energy consumption analysis, and device performance comparison radar charts.

## Project Structure

```
IndustrialDT/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── devices.py
│   │   │   ├── telemetry.py
│   │   │   ├── alerts.py
│   │   │   ├── maintenance.py
│   │   │   ├── dashboard.py
│   │   │   └── analytics.py
│   │   ├── core/            # Configuration
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/          # SQLAlchemy models
│   │   │   ├── device.py
│   │   │   ├── telemetry.py
│   │   │   ├── alert.py
│   │   │   ├── maintenance.py
│   │   │   └── user.py
│   │   ├── seed/            # Data seeding
│   │   │   └── seed.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── ThreeDView/
│   │   │   ├── Devices/
│   │   │   ├── Alerts/
│   │   │   ├── Maintenance/
│   │   │   ├── Analytics/
│   │   │   └── Login/
│   │   ├── components/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── README.md
├── LICENSE
└── .gitignore
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | User authentication |
| GET | `/api/v1/auth/me` | Current user info |
| GET | `/api/v1/devices/` | List all devices |
| GET | `/api/v1/devices/stats` | Device statistics |
| GET | `/api/v1/devices/workshops` | List workshops |
| GET | `/api/v1/telemetry/{id}` | Device telemetry data |
| GET | `/api/v1/telemetry/realtime/all` | Real-time all devices |
| POST | `/api/v1/telemetry/simulate` | Generate simulated data |
| GET | `/api/v1/alerts/` | List alerts |
| GET | `/api/v1/alerts/stats` | Alert statistics |
| PUT | `/api/v1/alerts/{id}/resolve` | Resolve alert |
| GET | `/api/v1/maintenance/` | List maintenance records |
| GET | `/api/v1/maintenance/calendar` | Calendar events |
| GET | `/api/v1/dashboard/overview` | Dashboard KPIs |
| GET | `/api/v1/dashboard/oee` | OEE statistics |
| GET | `/api/v1/analytics/mtbf-mttr` | Reliability stats |
| GET | `/api/v1/analytics/energy` | Energy analysis |
| GET | `/api/v1/analytics/device-comparison` | Device comparison |

## Seed Data

On first startup, the backend automatically seeds the database with:

- **16 devices** across 3 workshops (CNC machines, presses, conveyors, ovens, robotic arms)
- **11,520 telemetry records** (30 days of hourly data per device)
- **25 alerts** with mixed severity levels
- **12+ maintenance records** (completed and scheduled)
- **3 users** with different roles

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
