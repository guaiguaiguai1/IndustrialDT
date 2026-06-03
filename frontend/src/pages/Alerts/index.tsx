import { useEffect, useState } from 'react'
import { Table, Card, Tag, Button, Typography, Space, Select, Row, Col, Statistic, message, Spin, Popconfirm } from 'antd'
import { AlertOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { alertsApi } from '../../services/api'
import type { Alert, AlertStats } from '../../types'

const { Title, Text } = Typography

const fallbackAlerts: Alert[] = [
  { id: 1, device_id: 7, device_name: 'Hydraulic Press #2', type: 'temperature', severity: 'critical', message: 'Temperature exceeded 90C threshold', resolved: false, resolved_at: null, created_at: '2024-01-15T10:30:00' },
  { id: 2, device_id: 3, device_name: 'CNC Lathe #3', type: 'vibration', severity: 'critical', message: 'Excessive vibration detected (>12mm/s)', resolved: false, resolved_at: null, created_at: '2024-01-15T09:15:00' },
  { id: 3, device_id: 10, device_name: 'Conveyor Belt B1', type: 'vibration', severity: 'warning', message: 'Abnormal vibration pattern detected', resolved: false, resolved_at: null, created_at: '2024-01-14T16:45:00' },
  { id: 4, device_id: 12, device_name: 'Industrial Oven #1', type: 'temperature', severity: 'warning', message: 'Temperature rising above normal range', resolved: false, resolved_at: null, created_at: '2024-01-14T14:20:00' },
  { id: 5, device_id: 1, device_name: 'CNC Lathe #1', type: 'maintenance', severity: 'info', message: 'Maintenance reminder: due for inspection', resolved: true, resolved_at: '2024-01-13T10:00:00', created_at: '2024-01-12T08:00:00' },
  { id: 6, device_id: 5, device_name: 'Conveyor Belt A1', type: 'pressure', severity: 'warning', message: 'Pressure drop detected in hydraulic system', resolved: true, resolved_at: '2024-01-11T15:00:00', created_at: '2024-01-11T09:30:00' },
  { id: 7, device_id: 7, device_name: 'Hydraulic Press #2', type: 'current', severity: 'critical', message: 'Overcurrent protection triggered', resolved: false, resolved_at: null, created_at: '2024-01-15T11:00:00' },
  { id: 8, device_id: 9, device_name: 'Robotic Arm #2', type: 'vibration', severity: 'info', message: 'Bearing wear indicator detected', resolved: false, resolved_at: null, created_at: '2024-01-13T12:30:00' },
]

const fallbackStats: AlertStats = { total: 25, unresolved: 12, critical: 3, warning: 5, info: 4 }

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(fallbackAlerts)
  const [stats, setStats] = useState<AlertStats>(fallbackStats)
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState<string | undefined>()
  const [filterResolved, setFilterResolved] = useState<boolean | undefined>(undefined)

  const loadData = async () => {
    try {
      const [alertsRes, statsRes] = await Promise.all([
        alertsApi.list({ severity: filterSeverity, resolved: filterResolved }).catch(() => ({ data: fallbackAlerts })),
        alertsApi.stats().catch(() => ({ data: fallbackStats })),
      ])
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : fallbackAlerts)
      setStats(statsRes.data || fallbackStats)
    } catch {
      // use fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterSeverity, filterResolved])

  const handleResolve = async (id: number) => {
    try {
      await alertsApi.resolve(id)
      message.success('Alert resolved')
      loadData()
    } catch {
      message.error('Failed to resolve alert')
    }
  }

  const severityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    critical: { color: 'red', icon: <CloseCircleOutlined /> },
    warning: { color: 'orange', icon: <WarningOutlined /> },
    info: { color: 'blue', icon: <InfoCircleOutlined /> },
  }

  const columns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const config = severityConfig[severity] || severityConfig.info
        return (
          <Tag color={config.color} icon={config.icon}>
            {severity.toUpperCase()}
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
        <Tag style={{ textTransform: 'capitalize' }}>{type}</Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'resolved',
      key: 'resolved',
      width: 100,
      render: (resolved: boolean) => (
        <Tag color={resolved ? 'green' : 'red'}>
          {resolved ? 'Resolved' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: Alert) =>
        !record.resolved ? (
          <Popconfirm
            title="Mark this alert as resolved?"
            onConfirm={() => handleResolve(record.id)}
            okText="Resolve"
            cancelText="Cancel"
          >
            <Button type="primary" size="small" ghost>
              Resolve
            </Button>
          </Popconfirm>
        ) : (
          <Text style={{ color: '#8892b0', fontSize: 12 }}>
            {record.resolved_at ? new Date(record.resolved_at).toLocaleDateString() : ''}
          </Text>
        ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#e0e0e0' }}>
        <Space>
          <span style={{ color: '#00d2ff' }}>|</span>
          Alert Center
        </Space>
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Total Alerts</span>}
              value={stats.total}
              prefix={<AlertOutlined style={{ color: '#00d2ff' }} />}
              valueStyle={{ color: '#e0e0e0' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Critical</span>}
              value={stats.critical}
              prefix={<CloseCircleOutlined style={{ color: '#ff4757' }} />}
              valueStyle={{ color: '#ff4757' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Warning</span>}
              value={stats.warning}
              prefix={<WarningOutlined style={{ color: '#ffaa00' }} />}
              valueStyle={{ color: '#ffaa00' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={<span style={{ color: '#8892b0' }}>Info</span>}
              value={stats.info}
              prefix={<InfoCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="All Severities"
            allowClear
            style={{ width: 150 }}
            value={filterSeverity}
            onChange={setFilterSeverity}
            options={[
              { label: 'Critical', value: 'critical' },
              { label: 'Warning', value: 'warning' },
              { label: 'Info', value: 'info' },
            ]}
          />
          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: 150 }}
            value={filterResolved}
            onChange={setFilterResolved}
            options={[
              { label: 'Active', value: false },
              { label: 'Resolved', value: true },
            ]}
          />
        </Space>
      </Card>

      {/* Alerts Table */}
      <Card>
        <Table
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} alerts` }}
          scroll={{ x: 900 }}
          rowClassName={(record) => record.severity === 'critical' && !record.resolved ? 'ant-table-row-selected' : ''}
        />
      </Card>
    </div>
  )
}
