export interface Device {
  id: number
  name: string
  type: string
  model: string | null
  location: string
  status: 'online' | 'warning' | 'fault' | 'offline'
  health_score: number
  installation_date: string | null
  last_maintenance: string | null
  created_at: string | null
}

export interface TelemetryData {
  id: number
  device_id: number
  timestamp: string
  temperature: number
  vibration: number
  current: number
  pressure: number
  rpm: number
  power_consumption: number | null
}

export interface Alert {
  id: number
  device_id: number
  device_name?: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  resolved: boolean
  resolved_at: string | null
  created_at: string | null
}

export interface MaintenanceRecord {
  id: number
  device_id: number
  device_name?: string
  type: string
  description: string
  start_time: string
  end_time: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  technician: string | null
  cost: number | null
  notes: string | null
  created_at: string | null
}

export interface DeviceStats {
  total: number
  online: number
  warning: number
  fault: number
  offline: number
  avg_health_score: number
}

export interface AlertStats {
  total: number
  unresolved: number
  critical: number
  warning: number
  info: number
}

export interface OEEData {
  oee: number
  availability: number
  performance: number
  quality: number
}

export interface OEETrend {
  date: string
  oee: number
  availability: number
  performance: number
  quality: number
}

export interface DeviceComparison {
  device_id: number
  device_name: string
  device_type: string
  health_score: number
  avg_temperature: number
  max_temperature: number
  avg_vibration: number
  avg_power: number
  status: string
}

export interface MTBFMTTR {
  device_id: number
  device_name: string
  mtbf_hours: number
  mttr_hours: number
  availability: number
}

export interface EnergyData {
  date: string
  total_kwh: number
  avg_kw: number
}

export interface RealtimeDevice {
  device_id: number
  device_name: string
  status: string
  health_score: number
  temperature: number
  vibration: number
  current: number
  pressure: number
  rpm: number
  power_consumption: number
  timestamp: string
}
