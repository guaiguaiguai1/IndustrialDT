import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Space, Spin } from 'antd'
import {
  DesktopOutlined,
  AlertOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { dashboardApi } from '../../services/api'
import type { Device } from '../../types'

const { Title } = Typography

// Fallback data
const fallbackOverview = {
  total_devices: 16,
  online: 11,
  warning: 2,
  fault: 1,
  offline: 1,
  active_alerts: 12,
  avg_health_score: 82.5,
  status_distribution: { online: 11, warning: 2, fault: 1, offline: 1 },
}

const fallbackOEE = { oee: 76.2, availability: 92.5, performance: 88.3, quality: 96.1 }

const fallbackTrend = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return { date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 8) + 2 }
})

const fallbackDevices: (Device & { temperature?: number; vibration?: number })[] = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  name: `Device ${i + 1}`,
  type: 'CNC Machine',
  model: null,
  location: 'Workshop A',
  status: (['online', 'online', 'online', 'warning', 'fault', 'offline'] as const)[i % 6],
  health_score: 60 + Math.random() * 38,
  installation_date: null,
  last_maintenance: null,
  created_at: null,
  temperature: 30 + Math.random() * 50,
  vibration: Math.random() * 10,
}))

export default function Dashboard() {
  const [overview, setOverview] = useState(fallbackOverview)
  const [oee, setOee] = useState(fallbackOEE)
  const [trend, setTrend] = useState(fallbackTrend)
  const [devices, setDevices] = useState(fallbackDevices)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [overviewRes, oeeRes, trendRes, devicesRes] = await Promise.all([
          dashboardApi.overview().catch(() => ({ data: fallbackOverview })),
          dashboardApi.oee().catch(() => ({ data: fallbackOEE })),
          dashboardApi.oeeTrend().catch(() => ({ data: fallbackTrend })),
          dashboardApi.devices().catch(() => ({ data: fallbackDevices })),
        ])
        setOverview(overviewRes.data)
        setOee(oeeRes.data)
        setTrend(Array.isArray(trendRes.data) ? trendRes.data.slice(-7) : fallbackTrend)
        setDevices(Array.isArray(devicesRes.data) ? devicesRes.data : fallbackDevices)
      } catch {
        // use fallback
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      online: '#00ff88',
      warning: '#ffaa00',
      fault: '#ff4757',
      offline: '#666',
    }
    return map[status] || '#666'
  }

  const oeeGaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        splitNumber: 10,
        itemStyle: { color: '#00d2ff' },
        progress: {
          show: true,
          width: 20,
          roundCap: true,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#00d2ff' },
                { offset: 1, color: '#00ff88' },
              ],
            },
          },
        },
        pointer: { show: false },
        axisLine: {
          lineStyle: { width: 20, color: [[1, '#2a2a4a']] },
          roundCap: true,
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          offsetCenter: [0, '30%'],
          fontSize: 14,
          color: '#8892b0',
        },
        detail: {
          valueAnimation: true,
          fontSize: 36,
          fontWeight: 'bold',
          color: '#00d2ff',
          offsetCenter: [0, '-10%'],
          formatter: '{value}%',
        },
        data: [{ value: oee.oee, name: 'Overall OEE' }],
      },
    ],
  }

  const statusPieOption = {
    tooltip: { trigger: 'item', backgroundColor: '#1a1a2e', borderColor: '#2a2a4a', textStyle: { color: '#e0e0e0' } },
    legend: {
      bottom: 0,
      textStyle: { color: '#8892b0' },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#16213e', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' },
        },
        data: [
          { value: overview.status_distribution.online, name: 'Online', itemStyle: { color: '#00ff88' } },
          { value: overview.status_distribution.warning, name: 'Warning', itemStyle: { color: '#ffaa00' } },
          { value: overview.status_distribution.fault, name: 'Fault', itemStyle: { color: '#ff4757' } },
          { value: overview.status_distribution.offline, name: 'Offline', itemStyle: { color: '#666666' } },
        ].filter((item) => item.value > 0),
      },
    ],
  }

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a4a',
      textStyle: { color: '#e0e0e0' },
    },
    grid: { top: 20, right: 20, bottom: 30, left: 45 },
    xAxis: {
      type: 'category',
      data: trend.map((t: any) => {
        const date = new Date(t.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
      axisLine: { lineStyle: { color: '#2a2a4a' } },
      axisLabel: { color: '#8892b0' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1a2a3a' } },
      axisLabel: { color: '#8892b0' },
    },
    series: [
      {
        name: 'Alerts',
        type: 'line',
        smooth: true,
        data: trend.map((t: any) => t.count),
        lineStyle: { color: '#00d2ff', width: 3 },
        itemStyle: { color: '#00d2ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,210,255,0.3)' },
              { offset: 1, color: 'rgba(0,210,255,0)' },
            ],
          },
        },
      },
    ],
  }

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (status: string) => (
        <span className={`status-dot ${status}`} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: statusColor(status), boxShadow: `0 0 6px ${statusColor(status)}88` }} />
      ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Type', dataIndex: 'type', key: 'type', ellipsis: true },
    { title: 'Location', dataIndex: 'location', key: 'location', ellipsis: true },
    {
      title: 'Health',
      dataIndex: 'health_score',
      key: 'health_score',
      width: 100,
      sorter: (a: any, b: any) => a.health_score - b.health_score,
      render: (score: number) => (
        <span style={{ color: score > 80 ? '#00ff88' : score > 60 ? '#ffaa00' : '#ff4757', fontWeight: 600 }}>
          {score?.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Temp',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 80,
      render: (v: number | null) => v != null ? `${v.toFixed(1)}C` : '-',
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#e0e0e0' }}>
        <Space>
          <span style={{ color: '#00d2ff' }}>|</span>
          Monitoring Dashboard
        </Space>
      </Title>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderTop: '3px solid #00d2ff' }}>
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Total Devices</span>}
              value={overview.total_devices}
              prefix={<DesktopOutlined style={{ color: '#00d2ff' }} />}
              valueStyle={{ color: '#e0e0e0', fontSize: 28 }}
            />
            <div style={{ marginTop: 8, color: '#8892b0', fontSize: 12 }}>
              Across 3 workshops
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderTop: '3px solid #00ff88' }} className="kpi-card-green">
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Online / Offline</span>}
              value={overview.online}
              suffix={<span style={{ fontSize: 14, color: '#8892b0' }}>/ {overview.total_devices}</span>}
              prefix={<CheckCircleOutlined style={{ color: '#00ff88' }} />}
              valueStyle={{ color: '#00ff88', fontSize: 28 }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              {overview.warning > 0 && <Tag color="orange" style={{ margin: 0 }}>{overview.warning} warning</Tag>}
              {overview.fault > 0 && <Tag color="red" style={{ marginLeft: 4 }}>{overview.fault} fault</Tag>}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderTop: '3px solid #ff4757' }} className={overview.active_alerts > 10 ? 'kpi-card-red' : undefined}>
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Active Alerts</span>}
              value={overview.active_alerts}
              prefix={<AlertOutlined style={{ color: '#ff4757' }} />}
              valueStyle={{ color: '#ff4757', fontSize: 28 }}
            />
            <div style={{ marginTop: 8, color: '#8892b0', fontSize: 12 }}>
              Requires attention
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderTop: '3px solid #00d2ff' }}>
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Avg Health Score</span>}
              value={overview.avg_health_score}
              suffix="%"
              prefix={<HeartOutlined style={{ color: overview.avg_health_score > 80 ? '#00ff88' : '#ffaa00' }} />}
              valueStyle={{ color: overview.avg_health_score > 80 ? '#00ff88' : '#ffaa00', fontSize: 28 }}
              precision={1}
            />
            <div style={{ marginTop: 8, color: '#8892b0', fontSize: 12 }}>
              System health indicator
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: '#e0e0e0' }}>Overall Equipment Effectiveness</span>} style={{ height: 320 }}>
            <ReactECharts option={oeeGaugeOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: '#e0e0e0' }}>Equipment Status Distribution</span>} style={{ height: 320 }}>
            <ReactECharts option={statusPieOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: '#e0e0e0' }}>Alert Trend (Last 7 Days)</span>} style={{ height: 320 }}>
            <ReactECharts option={trendOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      {/* Device Table */}
      <Card title={<span style={{ color: '#e0e0e0' }}>Device Status Overview</span>}>
        <Table
          dataSource={devices}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: false }}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  )
}
