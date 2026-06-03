import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message, Space } from 'antd'
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authApi.login(values.username, values.password)
      const { access_token } = res.data

      // Set token first so the next request works
      setAuth(access_token, { id: 0, username: values.username, email: '', full_name: null, role: '' })

      // Get user info
      try {
        const meRes = await authApi.getMe()
        setAuth(access_token, meRes.data)
      } catch {
        // Token already set, proceed
      }

      message.success('Login successful')
      navigate('/dashboard')
    } catch {
      message.error('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorations */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,210,255,0.05) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,210,255,0.03) 0%, transparent 70%)',
        }}
      />

      <Card
        style={{
          width: 420,
          background: 'rgba(22, 33, 62, 0.9)',
          border: '1px solid #2a2a4a',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)',
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%', textAlign: 'center', marginBottom: 32 }}>
          <SafetyCertificateOutlined style={{ fontSize: 48, color: '#00d2ff' }} />
          <Title level={3} style={{ margin: 0, color: '#00d2ff' }} className="glow-cyan">
            Industrial Digital Twin
          </Title>
          <Text style={{ color: '#8892b0' }}>
            IoT-Powered Manufacturing Monitoring Platform
          </Text>
        </Space>

        <Form onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#8892b0' }} />}
              placeholder="Username"
              style={{ background: '#0f0f23', borderColor: '#2a2a4a' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8892b0' }} />}
              placeholder="Password"
              style={{ background: '#0f0f23', borderColor: '#2a2a4a' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                borderRadius: 8,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #00d2ff 0%, #0098b3 100%)',
                border: 'none',
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text style={{ color: '#5a6082', fontSize: 12 }}>
            Demo credentials: admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  )
}
