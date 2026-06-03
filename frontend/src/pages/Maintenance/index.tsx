import { useEffect, useState } from 'react'
import { Table, Card, Tag, Typography, Space, Select, Row, Col, Badge, Calendar, List, Spin } from 'antd'
import { ToolOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { maintenanceApi } from '../../services/api'
import type { MaintenanceRecord } from '../../types'

const { Title, Text } = Typography

const fallbackRecords: MaintenanceRecord[] = [
  { id: 1, device_id: 7, device_name: 'Hydraulic Press #2', type: 'corrective', description: 'Emergency hydraulic seal replacement due to pressure leak', start_time: '2024-01-10T08:00:00', end_time: '2024-01-10T14:00:00', status: 'completed', technician: 'Zhang Wei', cost: 3500, notes: 'Replaced all seals and tested pressure integrity', created_at: '2024-01-10T07:00:00' },
  { id: 2, device_id: 3, device_name: 'CNC Lathe #3', type: 'preventive', description: 'Scheduled bearing replacement and spindle alignment', start_time: '2024-01-15T09:00:00', end_time: null, status: 'in_progress', technician: 'Li Ming', cost: 2800, notes: null, created_at: '2024-01-14T10:00:00' },
  { id: 3, device_id: 1, device_name: 'CNC Lathe #1', type: 'preventive', description: 'Quarterly lubrication system service', start_time: '2024-01-20T08:00:00', end_time: '2024-01-20T12:00:00', status: 'scheduled', technician: 'Wang Fang', cost: 1200, notes: null, created_at: '2024-01-05T08:00:00' },
  { id: 4, device_id: 5, device_name: 'Conveyor Belt A1', type: 'predictive', description: 'Belt tension adjustment based on vibration analysis', start_time: '2024-01-22T10:00:00', end_time: null, status: 'scheduled', technician: 'Chen Jun', cost: 800, notes: null, created_at: '2024-01-08T14:00:00' },
  { id: 5, device_id: 12, device_name: 'Industrial Oven #1', type: 'preventive', description: 'Temperature sensor calibration and heating element inspection', start_time: '2024-01-08T08:00:00', end_time: '2024-01-08T16:00:00', status: 'completed', technician: 'Liu Yang', cost: 2200, notes: 'Calibrated 8 sensors, replaced 2 heating elements', created_at: '2024-01-02T09:00:00' },
  { id: 6, device_id: 8, device_name: 'Robotic Arm #1', type: 'preventive', description: 'Joint lubrication and encoder calibration', start_time: '2024-01-25T09:00:00', end_time: null, status: 'scheduled', technician: 'Zhang Wei', cost: 1500, notes: null, created_at: '2024-01-10T11:00:00' },
  { id: 7, device_id: 14, device_name: 'Conveyor Belt C1', type: 'corrective', description: 'Motor replacement after complete failure', start_time: '2024-01-12T07:00:00', end_time: '2024-01-13T15:00:00', status: 'completed', technician: 'Chen Jun', cost: 5200, notes: 'Replaced 3-phase motor and realigned drive shaft', created_at: '2024-01-12T06:30:00' },
  { id: 8, device_id: 9, device_name: 'Robotic Arm #2', type: 'predictive', description: 'Predictive maintenance based on vibration trend analysis', start_time: '2024-01-28T10:00:00', end_time: null, status: 'scheduled', technician: 'Li Ming', cost: 1800, notes: null, created_at: '2024-01-15T13:00:00' },
  { id: 9, device_id: 6, device_name: 'Hydraulic Press #1', type: 'preventive', description: 'Annual hydraulic fluid replacement and filter change', start_time: '2024-02-01T08:00:00', end_time: null, status: 'scheduled', technician: 'Wang Fang', cost: 2000, notes: null, created_at: '2024-01-15T09:00:00' },
  { id: 10, device_id: 15, device_name: 'CNC EDM #5', type: 'preventive', description: 'Wire guide replacement and dielectric fluid check', start_time: '2024-01-05T09:00:00', end_time: '2024-01-05T17:00:00', status: 'completed', technician: 'Liu Yang', cost: 1600, notes: 'All guides replaced, fluid level topped up', created_at: '2023-12-28T10:00:00' },
]

const fallbackCalendarEvents = [
  { id: 1, title: 'Corrective - Hydraulic Press #2', start: '2024-01-10', end: '2024-01-10', status: 'completed', type: 'corrective', device_name: 'Hydraulic Press #2' },
  { id: 2, title: 'Preventive - CNC Lathe #3', start: '2024-01-15', end: '2024-01-15', status: 'in_progress', type: 'preventive', device_name: 'CNC Lathe #3' },
  { id: 3, title: 'Preventive - CNC Lathe #1', start: '2024-01-20', end: '2024-01-20', status: 'scheduled', type: 'preventive', device_name: 'CNC Lathe #1' },
  { id: 4, title: 'Predictive - Conveyor Belt A1', start: '2024-01-22', end: '2024-01-22', status: 'scheduled', type: 'predictive', device_name: 'Conveyor Belt A1' },
  { id: 5, title: 'Preventive - Robotic Arm #1', start: '2024-01-25', end: '2024-01-25', status: 'scheduled', type: 'preventive', device_name: 'Robotic Arm #1' },
  { id: 6, title: 'Predictive - Robotic Arm #2', start: '2024-01-28', end: '2024-01-28', status: 'scheduled', type: 'predictive', device_name: 'Robotic Arm #2' },
]

export default function Maintenance() {
  const [records, setRecords] = useState<MaintenanceRecord[]>(fallbackRecords)
  const [calendarEvents, setCalendarEvents] = useState(fallbackCalendarEvents)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [recordsRes, calendarRes] = await Promise.all([
          maintenanceApi.list({ status: filterStatus }).catch(() => ({ data: fallbackRecords })),
          maintenanceApi.calendar().catch(() => ({ data: fallbackCalendarEvents })),
        ])
        setRecords(Array.isArray(recordsRes.data) ? recordsRes.data : fallbackRecords)
        setCalendarEvents(Array.isArray(calendarRes.data) ? calendarRes.data : fallbackCalendarEvents)
      } catch {
        // use fallback
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [filterStatus])

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    scheduled: { color: 'blue', icon: <ClockCircleOutlined /> },
    in_progress: { color: 'orange', icon: <SyncOutlined spin /> },
    completed: { color: 'green', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'default', icon: null },
  }

  const typeColors: Record<string, string> = {
    preventive: '#00d2ff',
    corrective: '#ff4757',
    predictive: '#00ff88',
  }

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig.scheduled
        return (
          <Tag color={config.color} icon={config.icon}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        )
      },
    },
    {
      title: 'Device',
      dataIndex: 'device_name',
      key: 'device_name',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={typeColors[type] || '#8892b0'} style={{ textTransform: 'capitalize' }}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Technician',
      dataIndex: 'technician',
      key: 'technician',
      width: 120,
    },
    {
      title: 'Scheduled',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (v: number | null) => v != null ? `¥${v.toLocaleString()}` : '-',
    },
  ]

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD')
    const dayEvents = calendarEvents.filter((e) => e.start === dateStr)
    return dayEvents.length > 0 ? (
      <List
        size="small"
        dataSource={dayEvents}
        renderItem={(item) => (
          <Badge
            color={typeColors[item.type] || '#8892b0'}
            text={<span style={{ fontSize: 11, color: '#e0e0e0' }}>{item.device_name}</span>}
          />
        )}
      />
    ) : null
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#e0e0e0' }}>
        <Space>
          <span style={{ color: '#00d2ff' }}>|</span>
          Maintenance Management
        </Space>
      </Title>

      {/* View toggle and filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Select
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { label: 'Table View', value: 'table' },
                  { label: 'Calendar View', value: 'calendar' },
                ]}
                style={{ width: 150 }}
              />
              {viewMode === 'table' && (
                <Select
                  placeholder="All Statuses"
                  allowClear
                  style={{ width: 160 }}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { label: 'Scheduled', value: 'scheduled' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' },
                  ]}
                />
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              {Object.entries(typeColors).map(([type, color]) => (
                <Tag key={type} color={color} style={{ textTransform: 'capitalize' }}>{type}</Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Content */}
      {viewMode === 'table' ? (
        <Card>
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} records` }}
            scroll={{ x: 1000 }}
          />
        </Card>
      ) : (
        <Card>
          <Calendar
            cellRender={(date, info) => {
              if (info.type === 'date') {
                return dateCellRender(date)
              }
              return info.originNode
            }}
          />
        </Card>
      )}
    </div>
  )
}
