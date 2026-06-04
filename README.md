# Industrial Digital Twin Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-049EF4?logo=three.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

工业数字孪生平台 - 基于IoT的设备监控、3D可视化、预测性维护和OEE分析系统。

</div>

---

## 功能特性

- **实时设备监控** - 覆盖3个车间16+台工业设备，实时遥测数据
- **3D车间可视化** - Three.js驱动的交互式3D视图，设备状态颜色编码，点击查看详细信息
- **预测性维护** - MTBF/MTTR分析，维护日历排程
- **OEE分析** - 设备综合效率分解（可用率 × 性能率 × 质量率）
- **告警管理** - 实时告警中心，严重级别分类，处理流程闭环
- **能耗分析** - 用电趋势和优化建议
- **设备管理** - 设备全生命周期，遥测历史和健康评分

## 技术栈

### 后端
| 技术 | 用途 |
|---|---|
| **Python 3.11+** | 运行时 |
| **FastAPI** | REST API框架 |
| **SQLAlchemy** | ORM |
| **SQLite** | 数据库 |
| **Pydantic** | 数据验证 |
| **JWT (python-jose)** | 认证 |

### 前端
| 技术 | 用途 |
|---|---|
| **React 18** | UI框架 |
| **TypeScript** | 类型安全 |
| **Vite** | 构建工具 |
| **Ant Design** | UI组件库 |
| **ECharts** | 数据可视化 |
| **Three.js / React Three Fiber** | 3D可视化 |
| **Zustand** | 状态管理 |
| **React Router** | 路由 |

## 系统架构

```
+-----------------------------------------------------+
|                   前端 (React)                       |
|  +----------+  +--------+  +--------+  +---------+  |
|  | 仪表盘   |  | 3D视图 |  | 告警   |  | 分析    |  |
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
|                  后端 (FastAPI)                       |
|  +----------+  +--------+  +--------+  +---------+  |
|  | 认证API  |  | 设备   |  | 遥测   |  | 仪表盘  |  |
|  +----------+  +--------+  +--------+  +---------+  |
|  +----------+  +--------+  +--------+               |
|  | 告警     |  | 维护   |  | 分析   |               |
|  +----------+  +--------+  +--------+               |
+-----------------------------------------------------+
                         |
                  SQLAlchemy ORM
                         |
+-----------------------------------------------------+
|                    SQLite 数据库                      |
|  devices | telemetry_data | alerts | maintenance     |
|  users                                              |
+-----------------------------------------------------+
```

## 快速开始

### 环境要求
- Python 3.11+
- Node.js 18+
- npm 或 yarn

### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务（首次运行自动初始化数据库）
uvicorn app.main:app --reload --port 8000
```

API地址: `http://localhost:8000`
API文档: `http://localhost:8000/docs`

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问地址: `http://localhost:5173`

### 默认账号
| 用户名 | 密码 | 角色 |
|---|---|---|
| admin | admin123 | 管理员 |
| engineer | engineer123 | 工程师 |
| operator | operator123 | 操作员 |

### Docker部署

```bash
docker-compose up --build
```

- 前端: `http://localhost`
- 后端API: `http://localhost:8000`

## 页面说明

### 仪表盘
主监控面板，包含KPI卡片、OEE仪表盘、状态分布饼图、告警趋势折线图和设备状态表格。

### 3D车间视图
交互式3D可视化，展示3个车间的16台设备。颜色代表状态（绿色=正常，黄色=告警，红色=故障，灰色=离线）。点击设备可查看实时遥测数据面板。支持轨道控制旋转视角。

### 设备管理
设备列表，支持按车间、状态、类型筛选。点击可查看详细遥测图表（温度、振动，48小时数据）。

### 告警中心
告警管理，包含严重级别标签（严重/告警/信息），筛选和一键处理功能。统计卡片展示告警分布。

### 分析报表
OEE趋势分解、MTBF/MTTR可靠性统计、能耗分析、设备性能对比雷达图。

## 项目结构

```
IndustrialDT/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API接口
│   │   │   ├── auth.py
│   │   │   ├── devices.py
│   │   │   ├── telemetry.py
│   │   │   ├── alerts.py
│   │   │   ├── maintenance.py
│   │   │   ├── dashboard.py
│   │   │   └── analytics.py
│   │   ├── core/            # 配置
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/          # SQLAlchemy模型
│   │   │   ├── device.py
│   │   │   ├── telemetry.py
│   │   │   ├── alert.py
│   │   │   ├── maintenance.py
│   │   │   └── user.py
│   │   ├── seed/            # 数据初始化
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

## API接口

| 方法 | 接口 | 说明 |
|---|---|---|
| POST | `/api/v1/auth/login` | 用户登录 |
| GET | `/api/v1/auth/me` | 当前用户信息 |
| GET | `/api/v1/devices/` | 设备列表 |
| GET | `/api/v1/devices/stats` | 设备统计 |
| GET | `/api/v1/devices/workshops` | 车间列表 |
| GET | `/api/v1/telemetry/{id}` | 设备遥测数据 |
| GET | `/api/v1/telemetry/realtime/all` | 所有设备实时数据 |
| POST | `/api/v1/telemetry/simulate` | 生成模拟数据 |
| GET | `/api/v1/alerts/` | 告警列表 |
| GET | `/api/v1/alerts/stats` | 告警统计 |
| PUT | `/api/v1/alerts/{id}/resolve` | 处理告警 |
| GET | `/api/v1/maintenance/` | 维护记录 |
| GET | `/api/v1/maintenance/calendar` | 维护日历 |
| GET | `/api/v1/dashboard/overview` | 仪表盘概览 |
| GET | `/api/v1/dashboard/oee` | OEE统计 |
| GET | `/api/v1/analytics/mtbf-mttr` | 可靠性统计 |
| GET | `/api/v1/analytics/energy` | 能耗分析 |
| GET | `/api/v1/analytics/device-comparison` | 设备对比 |

## 初始数据

首次启动时，后端自动初始化以下数据：

- **16台设备** - 分布在3个车间（CNC机床、冲压机、传送带、烘箱、机械臂）
- **11520条遥测记录** - 30天每小时数据
- **25条告警** - 混合严重级别
- **12+条维护记录** - 已完成和已计划
- **3个用户** - 不同角色

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

