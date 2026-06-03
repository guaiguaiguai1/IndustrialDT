import { useEffect, useState } from 'react'
import { Table, Card, Tag, Progress, Button, Modal, Typography, Space, Select, Row, Col, Spin, Tooltip } from 'antd'
import { EyeOutlined, FilterOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { devicesApi, telemetryApi } from '../../services/api'
import type { Device, TelemetryData } from '../../types'

const { Title, Text } = Typography

const fallbackDevices: Device[] = Array.from({ length: 16 }, (_, i) => {
  const types = ['CNC Machine', 'Hydraulic Press', 'Conveyor', 'Industrial Oven', 'Robotic Arm']
  const statuses: Device['status'][] = ['online', 'online', 'online', 'warning', 'fault', 'offline']
  const locations = ['Workshop A - Machining', 'Workshop B - Assembly', 'Workshop C - Heat Treatment']
  return {
    id: i + 1,
    name: `Device ${i + 1}`,
    type: types[i % 5],
    model: `Model-${String.fromCharCode(65 + i)}${i}`,
    location: locations[Math.floor(i / 6)],
    status: statuses[i % 6],
    health_score: 40 + Math.random() * 58,
    installation_date: '2023-06-15T00:00:00',
    last_maintenance: '2024-01-10T00:00:00',
    created_at: '2023-01-01T00:00:00',
  }
})

const fallbackTelemetry: TelemetryData[] = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  device_id: 1,
  timestamp: new Date(Date.now() - (47 - i) * 3600000).toISOString(),
  temperature: 45 + Math.random() * 30,
  vibration: 1 + Math.random() * 8,
  current: 15 + Math.random() * 25,
  pressure: 3 + Math.random() * 5,
  rpm: 1500 + Math.random() * 1500,
  power_consumption: 15 + Math.random() * 30,
}))

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>(fallbackDevices)
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>(fallbackTelemetry)
  const [telemetryLoading, setTelemetryLoading] = useState(false)

  // Filters
  const [filterLocation, setFilterLocation] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string | undefined>()
  const [filterType, setFilterType] = useState<string | undefined>()

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const res = await devicesApi.list({
          location: filterLocation,
          status: filterStatus,
          device_type: filterType,
        })
        setDevices(Array.isArray(res.data) ? res.data : fallbackDevices)
      } catch {
        setDevices(fallbackDevices)
      } finally {
        setLoading(false)
      }
    }
    loadDevices()
  }, [filterLocation, filterStatus, filterType])

  const openDetail = async (device: Device) => {
    setSelectedDevice(device)
    setModalVisible(true)
    setTelemetryLoading(true)
    try {
      const res = await telemetryApi.getByDevice(device.id, 48)
      setTelemetryData(Array.isArray(res.data) && res.data.length > 0 ? res.data : fallbackTelemetry)
    } catch {
      setTelemetryData(fallbackTelemetry)
    } finally {
      setTelemetryLoading(false)
    }
  }

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      online: 'green',
      warning: 'orange',
      fault: 'red',
      offline: 'default',
    }
    return map[status] || 'default'
  }

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={statusColor(status)} style={{ textTransform: 'capitalize' }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      sorter: (a: Device, b: Device) => a.name.localeCompare(b.name),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      ellipsis: true,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      ellipsis: true,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: 'Health Score',
      dataIndex: 'health_score',
      key: 'health_score',
      width: 160,
      sorter: (a: Device, b: Device) => a.health_score - b.health_score,
      render: (score: number) => {
        const color = score > 80 ? '#00ff88' : score > 60 ? '#ffaa00' : '#ff4757'
        return (
          <Progress
            percent={Math.round(score)}
            strokeColor={color}
            trailColor="#2a2a4a"
            size="small"
          />
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: Device) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            style={{ color: '#00d2ff' }}
            onClick={() => openDetail(record)}
          />
        </Tooltip>
      ),
    },
  ]

  const telemetryChartOption = telemetryData.length > 0 ? {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a4a',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      data: ['Temperature', 'Vibration'],
      textStyle: { color: '#8892b0' },
      top: 0,
    },
    grid: { top: 40, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: telemetryData.map((t) => {
        const d = new Date(t.timestamp)
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
      }),
      axisLine: { lineStyle: { color: '#2a2a4a' } },
      axisLabel: { color: '#8892b0', rotate: 45, fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Temp (C)',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1a2a3a' } },
        axisLabel: { color: '#8892b0' },
      },
      {
        type: 'value',
        name: 'Vib (mm/s)',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#8892b0' },
      },
    ],
    series: [
      {
        name: 'Temperature',
        type: 'line',
        smooth: true,
        data: telemetryData.map((t) => t.temperature),
        lineStyle: { color: '#ff4757', width: 2 },
        itemStyle: { color: '#ff4757' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255,71,87,0.2)' },
              { offset: 1, color: 'rgba(255,71,87,0)' },
            ],
          },
        },
      },
      {
        name: 'Vibration',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: telemetryData.map((t) => t.vibration),
        lineStyle: { color: '#00d2ff', width: 2 },
        itemStyle: { color: '#00d2ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,210,255,0.2)' },
              { offset: 1, color: 'rgba(0,210,255,0)' },
            ],
          },
        },
      },
    ],
  } : {}

  const workshopOptions = [
    'Workshop A - Machining',
    'Workshop B - Assembly',
    'Workshop C - Heat Treatment',
  ]
  const statusOptions = ['online', 'warning', 'fault', 'offline']
  const typeOptions = ['CNC Machine', 'Hydraulic Press', 'Conveyor', 'Industrial Oven', 'Robotic Arm']

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#e0e0e0' }}>
        <Space>
          <span style={{ color: '#00d2ff' }}>|</span>
          Device Management
        </Space>
      </Title>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <FilterOutlined style={{ color: '#8892b0' }} />
          <Select
            placeholder="All Workshops"
            allowClear
            style={{ width: 200 }}
            value={filterLocation}
            onChange={setFilterLocation}
            options={workshopOptions.map((w) => ({ label: w, value: w }))}
          />
          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: 150 }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusOptions.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
          />
          <Select
            placeholder="All Types"
            allowClear
            style={{ width: 180 }}
            value={filterType}
            onChange={setFilterType}
            options={typeOptions.map((t) => ({ label: t, value: t }))}
          />
        </Space>
      </Card>

      {/* Device Table */}
      <Card>
        <Table
          dataSource={devices}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} devices` }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Device Detail Modal */}
      <Modal
        title={
          <Space>
            <span>{selectedDevice?.name}</span>
            <Tag color={statusColor(selectedDevice?.status || '')}>
              {selectedDevice?.status}
            </Tag>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        styles={{ body: { padding: '16px 0' } }}
      >
        {selectedDevice && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text style={{ color: '#8892b0', fontSize: 12 }}>Type</Text>
                <div style={{ color: '#e0e0e0' }}>{selectedDevice.type}</div>
              </Col>
              <Col span={8}>
                <Text style={{ color: '#8892b0', fontSize: 12 }}>Model</Text>
                <div style={{ color: '#e0e0e0' }}>{selectedDevice.model || '-'}</div>
              </Col>
              <Col span={8}>
                <Text style={{ color: '#8892b0', fontSize: 12 }}>Location</Text>
                <div style={{ color: '#e0e0e0' }}>{selectedDevice.location}</div>
              </Col>
              <Col span={8}>
                <Text style={{ color: '#8892b0', fontSize: 12 }}>Health Score</Text>
                <Progress
                  percent={Math.round(selectedDevice.health_score)}
                  strokeColor={selectedDevice.health_score > 80 ? '#00ff88' : selectedDevice.health_score > 60 ? '#ffaa00' : '#ff4757'}
                  trailColor="#2a2a4a"
                />
              </Col>
              <Col span={8}>
                <Text style={{ color: '#8892b0', fontSize: 12 }}>Installed</Text>
                <div style={{ color: '#e0e0e0' }}>
                  {selectedDevice.installation_date ? new Date(selectedDevice.installation_date).toLocaleDateString() : '-'}
                </div>
              </Col>
              <Col span={8}>
                <Text style={{ color: '#8892b0', fontSize: 12 }}>Last Maintenance</Text>
                <div style={{ color: '#e0e0e0' }}>
                  {selectedDevice.last_maintenance ? new Date(selectedDevice.last_maintenance).toLocaleDateString() : '-'}
                </div>
              </Col>
            </Row>

            <Title level={5} style={{ color: '#e0e0e0', marginTop: 16, marginBottom: 8 }}>
              Telemetry History (48h)
            </Title>
            {telemetryLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (
              <ReactECharts option={telemetryChartOption} style={{ height: 300 }} />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
