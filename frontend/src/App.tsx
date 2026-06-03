import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Avatar, Space, Dropdown } from 'antd'
import {
  DashboardOutlined,
  AlertOutlined,
  ToolOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  BoxPlotOutlined,
  DesktopOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useAuthStore } from './stores/authStore'

import Dashboard from './pages/Dashboard'
import ThreeDView from './pages/ThreeDView'
import Devices from './pages/Devices'
import Alerts from './pages/Alerts'
import Maintenance from './pages/Maintenance'
import Analytics from './pages/Analytics'
import Login from './pages/Login'

const { Header, Sider, Content } = Layout
const { Title } = Typography

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/3d-view',
      icon: <BoxPlotOutlined />,
      label: '3D Workshop',
    },
    {
      key: '/devices',
      icon: <DesktopOutlined />,
      label: 'Devices',
    },
    {
      key: '/alerts',
      icon: <AlertOutlined />,
      label: 'Alerts',
    },
    {
      key: '/maintenance',
      icon: <ToolOutlined />,
      label: 'Maintenance',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.full_name || user?.username || 'User',
      disabled: true,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleUserMenu = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          borderRight: '1px solid #2a2a4a',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #2a2a4a',
          }}
        >
          <Title
            level={4}
            style={{
              margin: 0,
              color: '#00d2ff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            className="glow-cyan"
          >
            {collapsed ? 'DT' : 'Industrial DT'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none', marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #2a2a4a',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#e0e0e0', fontSize: 18 }}
            />
            <Title level={5} style={{ margin: 0, color: '#8892b0' }}>
              Digital Twin Monitoring System
            </Title>
          </Space>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#00d2ff' }} />
              <span style={{ color: '#e0e0e0' }}>{user?.full_name || user?.username}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/3d-view" element={<ThreeDView />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  const { token } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
