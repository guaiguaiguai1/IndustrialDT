import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('industrial-dt-auth')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {
      // ignore
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('industrial-dt-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  getMe: () => api.get('/auth/me'),
}

// Devices
export const devicesApi = {
  list: (params?: { location?: string; status?: string; device_type?: string }) =>
    api.get('/devices/', { params }),
  get: (id: number) => api.get(`/devices/${id}`),
  stats: () => api.get('/devices/stats'),
  workshops: () => api.get('/devices/workshops'),
}

// Telemetry
export const telemetryApi = {
  getByDevice: (deviceId: number, hours?: number) =>
    api.get(`/telemetry/${deviceId}`, { params: { hours } }),
  getLatest: (deviceId: number) => api.get(`/telemetry/${deviceId}/latest`),
  getRealtimeAll: () => api.get('/telemetry/realtime/all'),
  simulate: () => api.post('/telemetry/simulate'),
}

// Alerts
export const alertsApi = {
  list: (params?: { severity?: string; device_id?: number; resolved?: boolean }) =>
    api.get('/alerts/', { params }),
  stats: () => api.get('/alerts/stats'),
  trend: () => api.get('/alerts/trend'),
  resolve: (id: number) => api.put(`/alerts/${id}/resolve`),
}

// Maintenance
export const maintenanceApi = {
  list: (params?: { device_id?: number; status?: string }) =>
    api.get('/maintenance/', { params }),
  calendar: () => api.get('/maintenance/calendar'),
}

// Dashboard
export const dashboardApi = {
  overview: () => api.get('/dashboard/overview'),
  oee: () => api.get('/dashboard/oee'),
  oeeTrend: () => api.get('/dashboard/oee/trend'),
  devices: () => api.get('/dashboard/devices'),
}

// Analytics
export const analyticsApi = {
  mtbfMttr: () => api.get('/analytics/mtbf-mttr'),
  energy: () => api.get('/analytics/energy'),
  deviceComparison: () => api.get('/analytics/device-comparison'),
  oeeBreakdown: () => api.get('/analytics/oee-breakdown'),
}

export default api
