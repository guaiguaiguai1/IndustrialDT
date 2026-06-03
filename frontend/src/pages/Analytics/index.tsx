import { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, Space, Spin, Tabs, Table, Tag } from 'antd'
import ReactECharts from 'echarts-for-react'
import { analyticsApi } from '../../services/api'
import type { DeviceComparison, MTBFMTTR, EnergyData, OEETrend } from '../../types'

const { Title, Text } = Typography

// Fallback data
const fallbackOeeBreakdown: OEETrend[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toISOString().split('T')[0],
    oee: 70 + Math.random() * 20,
    availability: 85 + Math.random() * 14,
    performance: 80 + Math.random() * 15,
    quality: 92 + Math.random() * 7,
  }
})

const fallbackMtbfMttr: MTBFMTTR[] = Array.from({ length: 16 }, (_, i) => ({
  device_id: i + 1,
  device_name: `Device ${i + 1}`,
  mtbf_hours: 200 + Math.random() * 1800,
  mttr_hours: 1 + Math.random() * 7,
  availability: 85 + Math.random() * 14,
}))

const fallbackEnergy: EnergyData[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toISOString().split('T')[0],
    total_kwh: 800 + Math.random() * 600,
    avg_kw: 30 + Math.random() * 20,
  }
})

const fallbackComparison: DeviceComparison[] = Array.from({ length: 16 }, (_, i) => ({
  device_id: i + 1,
  device_name: `Device ${i + 1}`,
  device_type: ['CNC Machine', 'Hydraulic Press', 'Conveyor', 'Industrial Oven', 'Robotic Arm'][i % 5],
  health_score: 50 + Math.random() * 48,
  avg_temperature: 30 + Math.random() * 50,
  max_temperature: 60 + Math.random() * 30,
  avg_vibration: 1 + Math.random() * 8,
  avg_power: 10 + Math.random() * 40,
  status: ['online', 'online', 'online', 'warning', 'fault', 'offline'][i % 6],
}))

export default function Analytics() {
  const [oeeBreakdown, setOeeBreakdown] = useState<OEETrend[]>(fallbackOeeBreakdown)
  const [mtbfMttr, setMtbfMttr] = useState<MTBFMTTR[]>(fallbackMtbfMttr)
  const [energy, setEnergy] = useState<EnergyData[]>(fallbackEnergy)
  const [comparison, setComparison] = useState<DeviceComparison[]>(fallbackComparison)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [oeeRes, mtbfRes, energyRes, compRes] = await Promise.all([
          analyticsApi.oeeBreakdown().catch(() => ({ data: fallbackOeeBreakdown })),
          analyticsApi.mtbfMttr().catch(() => ({ data: fallbackMtbfMttr })),
          analyticsApi.energy().catch(() => ({ data: fallbackEnergy })),
          analyticsApi.deviceComparison().catch(() => ({ data: fallbackComparison })),
        ])
        setOeeBreakdown(Array.isArray(oeeRes.data) ? oeeRes.data : fallbackOeeBreakdown)
        setMtbfMttr(Array.isArray(mtbfRes.data) ? mtbfRes.data : fallbackMtbfMttr)
        setEnergy(Array.isArray(energyRes.data) ? energyRes.data : fallbackEnergy)
        setComparison(Array.isArray(compRes.data) ? compRes.data : fallbackComparison)
      } catch {
        // use fallback
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // OEE Trend Chart
  const oeeTrendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a4a',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      data: ['OEE', 'Availability', 'Performance', 'Quality'],
      textStyle: { color: '#8892b0' },
      top: 0,
    },
    grid: { top: 40, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: oeeBreakdown.map((t) => {
        const d = new Date(t.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      }),
      axisLine: { lineStyle: { color: '#2a2a4a' } },
      axisLabel: { color: '#8892b0', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1a2a3a' } },
      axisLabel: { color: '#8892b0' },
    },
    series: [
      {
        name: 'OEE',
        type: 'line',
        smooth: true,
        data: oeeBreakdown.map((t) => t.oee),
        lineStyle: { color: '#00d2ff', width: 3 },
        itemStyle: { color: '#00d2ff' },
      },
      {
        name: 'Availability',
        type: 'line',
        smooth: true,
        data: oeeBreakdown.map((t) => t.availability),
        lineStyle: { color: '#00ff88', width: 1.5 },
        itemStyle: { color: '#00ff88' },
      },
      {
        name: 'Performance',
        type: 'line',
        smooth: true,
        data: oeeBreakdown.map((t) => t.performance),
        lineStyle: { color: '#ffaa00', width: 1.5 },
        itemStyle: { color: '#ffaa00' },
      },
      {
        name: 'Quality',
        type: 'line',
        smooth: true,
        data: oeeBreakdown.map((t) => t.quality),
        lineStyle: { color: '#ff6b9d', width: 1.5 },
        itemStyle: { color: '#ff6b9d' },
      },
    ],
  }

  // Energy Consumption Chart
  const energyOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a4a',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      data: ['Total kWh', 'Avg kW'],
      textStyle: { color: '#8892b0' },
      top: 0,
    },
    grid: { top: 40, right: 50, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: energy.map((t) => {
        const d = new Date(t.date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      }),
      axisLine: { lineStyle: { color: '#2a2a4a' } },
      axisLabel: { color: '#8892b0', fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'kWh',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1a2a3a' } },
        axisLabel: { color: '#8892b0' },
      },
      {
        type: 'value',
        name: 'kW',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#8892b0' },
      },
    ],
    series: [
      {
        name: 'Total kWh',
        type: 'bar',
        data: energy.map((t) => t.total_kwh),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#00d2ff' },
              { offset: 1, color: '#006680' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'Avg kW',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: energy.map((t) => t.avg_kw),
        lineStyle: { color: '#ff6b9d', width: 2 },
        itemStyle: { color: '#ff6b9d' },
      },
    ],
  }

  // Device comparison radar
  const radarOption = {
    tooltip: { backgroundColor: '#1a1a2e', borderColor: '#2a2a4a', textStyle: { color: '#e0e0e0' } },
    legend: {
      data: comparison.slice(0, 5).map((d) => d.device_name),
      textStyle: { color: '#8892b0' },
      bottom: 0,
    },
    radar: {
      indicator: [
        { name: 'Health', max: 100 },
        { name: 'Temp', max: 100 },
        { name: 'Vibration', max: 15 },
        { name: 'Power', max: 60 },
      ],
      axisName: { color: '#8892b0' },
      splitArea: { areaStyle: { color: ['#0f0f23', '#16213e'] } },
      splitLine: { lineStyle: { color: '#2a2a4a' } },
      axisLine: { lineStyle: { color: '#2a2a4a' } },
    },
    series: [
      {
        type: 'radar',
        data: comparison.slice(0, 5).map((d, i) => ({
          value: [d.health_score, d.avg_temperature, d.avg_vibration, d.avg_power],
          name: d.device_name,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.1 },
        })),
      },
    ],
  }

  // MTBF/MTTR comparison bar chart
  const mtbfOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a4a',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      data: ['MTBF (hours)', 'MTTR (hours)'],
      textStyle: { color: '#8892b0' },
      top: 0,
    },
    grid: { top: 40, right: 20, bottom: 60, left: 50 },
    xAxis: {
      type: 'category',
      data: mtbfMttr.map((d) => d.device_name),
      axisLine: { lineStyle: { color: '#2a2a4a' } },
      axisLabel: { color: '#8892b0', rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1a2a3a' } },
      axisLabel: { color: '#8892b0' },
    },
    series: [
      {
        name: 'MTBF (hours)',
        type: 'bar',
        data: mtbfMttr.map((d) => d.mtbf_hours),
        itemStyle: { color: '#00ff88', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'MTTR (hours)',
        type: 'bar',
        data: mtbfMttr.map((d) => d.mttr_hours),
        itemStyle: { color: '#ff4757', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  // MTBF/MTTR table columns
  const mtbfColumns = [
    { title: 'Device', dataIndex: 'device_name', key: 'device_name', ellipsis: true },
    {
      title: 'MTBF (hours)',
      dataIndex: 'mtbf_hours',
      key: 'mtbf_hours',
      width: 130,
      sorter: (a: MTBFMTTR, b: MTBFMTTR) => a.mtbf_hours - b.mtbf_hours,
      render: (v: number) => <span style={{ color: '#00ff88' }}>{v.toFixed(0)}</span>,
    },
    {
      title: 'MTTR (hours)',
      dataIndex: 'mttr_hours',
      key: 'mttr_hours',
      width: 130,
      sorter: (a: MTBFMTTR, b: MTBFMTTR) => a.mttr_hours - b.mttr_hours,
      render: (v: number) => <span style={{ color: '#ff4757' }}>{v.toFixed(1)}</span>,
    },
    {
      title: 'Availability',
      dataIndex: 'availability',
      key: 'availability',
      width: 120,
      sorter: (a: MTBFMTTR, b: MTBFMTTR) => a.availability - b.availability,
      render: (v: number) => {
        const color = v > 95 ? '#00ff88' : v > 85 ? '#ffaa00' : '#ff4757'
        return <span style={{ color, fontWeight: 600 }}>{v.toFixed(1)}%</span>
      },
    },
  ]

  const comparisonColumns = [
    { title: 'Device', dataIndex: 'device_name', key: 'device_name', ellipsis: true },
    { title: 'Type', dataIndex: 'device_type', key: 'device_type', ellipsis: true },
    {
      title: 'Health',
      dataIndex: 'health_score',
      key: 'health_score',
      width: 90,
      sorter: (a: DeviceComparison, b: DeviceComparison) => a.health_score - b.health_score,
      render: (v: number) => {
        const color = v > 80 ? '#00ff88' : v > 60 ? '#ffaa00' : '#ff4757'
        return <span style={{ color }}>{v.toFixed(1)}%</span>
      },
    },
    {
      title: 'Avg Temp',
      dataIndex: 'avg_temperature',
      key: 'avg_temperature',
      width: 100,
      render: (v: number) => `${v.toFixed(1)}C`,
    },
    {
      title: 'Avg Vib',
      dataIndex: 'avg_vibration',
      key: 'avg_vibration',
      width: 100,
      render: (v: number) => `${v.toFixed(2)} mm/s`,
    },
    {
      title: 'Avg Power',
      dataIndex: 'avg_power',
      key: 'avg_power',
      width: 100,
      render: (v: number) => `${v.toFixed(1)} kW`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const colorMap: Record<string, string> = { online: 'green', warning: 'orange', fault: 'red', offline: 'default' }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading analytics..." />
      </div>
    )
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#e0e0e0' }}>
        <Space>
          <span style={{ color: '#00d2ff' }}>|</span>
          Analytics & Reports
        </Space>
      </Title>

      <Tabs
        defaultActiveKey="oee"
        items={[
          {
            key: 'oee',
            label: 'OEE Analysis',
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title={<span style={{ color: '#e0e0e0' }}>OEE Trend (30 Days)</span>}>
                    <ReactECharts option={oeeTrendOption} style={{ height: 350 }} />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'reliability',
            label: 'Reliability (MTBF/MTTR)',
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title={<span style={{ color: '#e0e0e0' }}>MTBF / MTTR Comparison</span>}>
                    <ReactECharts option={mtbfOption} style={{ height: 350 }} />
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title={<span style={{ color: '#e0e0e0' }}>Reliability Statistics</span>}>
                    <Table
                      dataSource={mtbfMttr}
                      columns={mtbfColumns}
                      rowKey="device_id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                      scroll={{ x: 500 }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'energy',
            label: 'Energy Consumption',
            children: (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title={<span style={{ color: '#e0e0e0' }}>Energy Consumption Trend (30 Days)</span>}>
                    <ReactECharts option={energyOption} style={{ height: 350 }} />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'comparison',
            label: 'Device Comparison',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={10}>
                  <Card title={<span style={{ color: '#e0e0e0' }}>Performance Radar (Top 5)</span>}>
                    <ReactECharts option={radarOption} style={{ height: 350 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={14}>
                  <Card title={<span style={{ color: '#e0e0e0' }}>All Devices Comparison</span>}>
                    <Table
                      dataSource={comparison}
                      columns={comparisonColumns}
                      rowKey="device_id"
                      pagination={{ pageSize: 8 }}
                      size="small"
                      scroll={{ x: 700 }}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </div>
  )
}
