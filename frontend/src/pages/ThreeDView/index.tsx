import { Suspense, useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Html, Grid } from '@react-three/drei'
import { Card, Typography, Tag, Progress, Space, Spin, Button, Tooltip } from 'antd'
import { ReloadOutlined, FullscreenOutlined, InfoCircleOutlined } from '@ant-design/icons'
import * as THREE from 'three'
import { telemetryApi } from '../../services/api'
import type { RealtimeDevice } from '../../types'

const { Title, Text: AntText } = Typography

// Fallback device positions in 3D space
const fallbackDevices: RealtimeDevice[] = [
  { device_id: 1, device_name: 'CNC Lathe #1', status: 'online', health_score: 94.5, temperature: 58.3, vibration: 3.2, current: 28.5, pressure: 5.2, rpm: 2400, power_consumption: 32.1, timestamp: '' },
  { device_id: 2, device_name: 'CNC Mill #2', status: 'online', health_score: 91.2, temperature: 62.1, vibration: 4.1, current: 35.2, pressure: 4.8, rpm: 3100, power_consumption: 38.5, timestamp: '' },
  { device_id: 3, device_name: 'CNC Lathe #3', status: 'warning', health_score: 72.8, temperature: 78.4, vibration: 8.5, current: 42.1, pressure: 6.1, rpm: 1800, power_consumption: 45.2, timestamp: '' },
  { device_id: 4, device_name: 'CNC Router #4', status: 'online', health_score: 88.6, temperature: 52.7, vibration: 2.8, current: 22.3, pressure: 3.5, rpm: 2800, power_consumption: 25.6, timestamp: '' },
  { device_id: 5, device_name: 'Conveyor Belt A1', status: 'online', health_score: 96.1, temperature: 32.5, vibration: 1.2, current: 8.5, pressure: 1.5, rpm: 1200, power_consumption: 12.3, timestamp: '' },
  { device_id: 6, device_name: 'Hydraulic Press #1', status: 'online', health_score: 89.3, temperature: 65.8, vibration: 5.6, current: 38.2, pressure: 8.5, rpm: 800, power_consumption: 42.1, timestamp: '' },
  { device_id: 7, device_name: 'Hydraulic Press #2', status: 'fault', health_score: 45.2, temperature: 92.1, vibration: 14.2, current: 48.5, pressure: 9.2, rpm: 400, power_consumption: 55.8, timestamp: '' },
  { device_id: 8, device_name: 'Robotic Arm #1', status: 'online', health_score: 97.0, temperature: 42.3, vibration: 1.8, current: 18.5, pressure: 4.2, rpm: 1500, power_consumption: 22.4, timestamp: '' },
  { device_id: 9, device_name: 'Robotic Arm #2', status: 'online', health_score: 93.5, temperature: 45.1, vibration: 2.1, current: 20.3, pressure: 3.8, rpm: 1800, power_consumption: 24.1, timestamp: '' },
  { device_id: 10, device_name: 'Conveyor Belt B1', status: 'warning', health_score: 68.4, temperature: 41.2, vibration: 6.8, current: 15.2, pressure: 2.1, rpm: 900, power_consumption: 18.5, timestamp: '' },
  { device_id: 11, device_name: 'Assembly Station #1', status: 'online', health_score: 90.1, temperature: 48.5, vibration: 3.5, current: 25.1, pressure: 5.5, rpm: 2000, power_consumption: 28.3, timestamp: '' },
  { device_id: 12, device_name: 'Industrial Oven #1', status: 'online', health_score: 85.7, temperature: 88.2, vibration: 1.5, current: 35.8, pressure: 3.2, rpm: 0, power_consumption: 48.5, timestamp: '' },
  { device_id: 13, device_name: 'Industrial Oven #2', status: 'online', health_score: 92.3, temperature: 82.5, vibration: 1.2, current: 32.5, pressure: 2.8, rpm: 0, power_consumption: 45.2, timestamp: '' },
  { device_id: 14, device_name: 'Conveyor Belt C1', status: 'offline', health_score: 30.0, temperature: 22.0, vibration: 0.0, current: 0.0, pressure: 0.0, rpm: 0, power_consumption: 0.0, timestamp: '' },
  { device_id: 15, device_name: 'CNC EDM #5', status: 'online', health_score: 87.9, temperature: 55.8, vibration: 3.8, current: 28.2, pressure: 4.5, rpm: 2200, power_consumption: 30.5, timestamp: '' },
  { device_id: 16, device_name: 'Robotic Arm #3', status: 'online', health_score: 95.2, temperature: 40.5, vibration: 1.5, current: 16.8, pressure: 3.5, rpm: 1600, power_consumption: 20.8, timestamp: '' },
]

// Position devices in 3D space by workshop
function getDevicePosition(device: RealtimeDevice, index: number): [number, number, number] {
  const workshop = index < 5 ? 'A' : index < 11 ? 'B' : 'C'
  const workshopOffset = workshop === 'A' ? -12 : workshop === 'B' ? 0 : 12
  const localIndex = workshop === 'A' ? index : workshop === 'B' ? index - 5 : index - 11

  const col = localIndex % 3
  const row = Math.floor(localIndex / 3)

  return [workshopOffset + col * 4, 1.2, row * 5 - 4]
}

function getDeviceShape(type: string): 'box' | 'cylinder' | 'sphere' {
  if (type.includes('CNC') || type.includes('Press')) return 'box'
  if (type.includes('Conveyor')) return 'cylinder'
  if (type.includes('Oven')) return 'box'
  if (type.includes('Robot') || type.includes('Assembly')) return 'sphere'
  return 'box'
}

function statusToColor(status: string): string {
  const map: Record<string, string> = {
    online: '#00ff88',
    warning: '#ffaa00',
    fault: '#ff4757',
    offline: '#444444',
  }
  return map[status] || '#444444'
}

function DeviceModel({ device, index, onClick }: { device: RealtimeDevice; index: number; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const position = getDevicePosition(device, index)
  const color = statusToColor(device.status)
  const shape = getDeviceShape(device.device_name)

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation for online devices
      if (device.status === 'online') {
        meshRef.current.rotation.y += 0.003
      }
      // Pulsing glow for warning/fault
      if (device.status === 'warning' || device.status === 'fault') {
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7
        meshRef.current.scale.setScalar(0.9 + pulse * 0.15)
        if (glowRef.current) {
          const mat = glowRef.current.material as THREE.MeshStandardMaterial
          mat.opacity = pulse * 0.3
        }
      }
    }
  })

  const geometry = useMemo(() => {
    switch (shape) {
      case 'cylinder':
        return <cylinderGeometry args={[0.7, 0.7, 1.6, 16]} />
      case 'sphere':
        return <sphereGeometry args={[0.8, 16, 16]} />
      default:
        return <boxGeometry args={[1.6, 1.6, 1.6]} />
    }
  }, [shape])

  return (
    <group position={position}>
      {/* Main device mesh */}
      <mesh ref={meshRef} onClick={onClick} castShadow>
        {geometry}
        <meshStandardMaterial
          color={color}
          metalness={0.6}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={device.status === 'offline' ? 0 : 0.2}
        />
      </mesh>

      {/* Glow sphere for warning/fault devices */}
      {(device.status === 'warning' || device.status === 'fault') && (
        <mesh ref={glowRef} scale={1.5}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}

      {/* Device name label */}
      <Text
        position={[0, 1.8, 0]}
        fontSize={0.35}
        color="#e0e0e0"
        anchorX="center"
        anchorY="bottom"
        maxWidth={4}
      >
        {device.device_name}
      </Text>

      {/* Status indicator bar */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[1.8, 0.1, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function WorkshopLabel({ position, name }: { position: [number, number, number]; name: string }) {
  return (
    <Text
      position={position}
      fontSize={0.6}
      color="#00d2ff"
      anchorX="center"
      anchorY="middle"
      font={undefined}
    >
      {name}
    </Text>
  )
}

function FloorGrid() {
  return (
    <>
      <Grid
        args={[60, 60]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#1a2a3a"
        sectionSize={6}
        sectionThickness={1}
        sectionColor="#2a3a4a"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0a0a1a" transparent opacity={0.8} />
      </mesh>
    </>
  )
}

function DeviceInfoPanel({ device, onClose }: { device: RealtimeDevice; onClose: () => void }) {
  const healthColor = device.health_score > 80 ? '#00ff88' : device.health_score > 60 ? '#ffaa00' : '#ff4757'

  return (
    <Html center position={[0, 5, 0]} style={{ pointerEvents: 'auto' }}>
      <Card
        style={{
          width: 320,
          background: 'rgba(22, 33, 62, 0.95)',
          border: '1px solid #2a2a4a',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: '#e0e0e0',
        }}
        styles={{ body: { padding: 16 } }}
        extra={
          <Button type="text" size="small" onClick={onClose} style={{ color: '#8892b0' }}>
            X
          </Button>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <AntText strong style={{ color: '#e0e0e0', fontSize: 16 }}>{device.device_name}</AntText>
            <Tag color={statusToColor(device.status)} style={{ margin: 0 }}>
              {device.status.toUpperCase()}
            </Tag>
          </div>

          <div>
            <AntText style={{ color: '#8892b0', fontSize: 12 }}>Health Score</AntText>
            <Progress
              percent={device.health_score}
              strokeColor={healthColor}
              trailColor="#2a2a4a"
              size="small"
              format={(val) => `${val}%`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <AntText style={{ color: '#8892b0', fontSize: 11 }}>Temperature</AntText>
              <div style={{ color: device.temperature > 85 ? '#ff4757' : '#00d2ff', fontWeight: 600 }}>
                {device.temperature.toFixed(1)}C
              </div>
            </div>
            <div>
              <AntText style={{ color: '#8892b0', fontSize: 11 }}>Vibration</AntText>
              <div style={{ color: device.vibration > 8 ? '#ff4757' : '#00d2ff', fontWeight: 600 }}>
                {device.vibration.toFixed(2)} mm/s
              </div>
            </div>
            <div>
              <AntText style={{ color: '#8892b0', fontSize: 11 }}>Current</AntText>
              <div style={{ color: '#00d2ff', fontWeight: 600 }}>{device.current.toFixed(1)} A</div>
            </div>
            <div>
              <AntText style={{ color: '#8892b0', fontSize: 11 }}>Pressure</AntText>
              <div style={{ color: '#00d2ff', fontWeight: 600 }}>{device.pressure.toFixed(1)} bar</div>
            </div>
            <div>
              <AntText style={{ color: '#8892b0', fontSize: 11 }}>RPM</AntText>
              <div style={{ color: '#00d2ff', fontWeight: 600 }}>{device.rpm.toFixed(0)}</div>
            </div>
            <div>
              <AntText style={{ color: '#8892b0', fontSize: 11 }}>Power</AntText>
              <div style={{ color: '#00d2ff', fontWeight: 600 }}>{device.power_consumption.toFixed(1)} kW</div>
            </div>
          </div>
        </Space>
      </Card>
    </Html>
  )
}

export default function ThreeDView() {
  const [devices, setDevices] = useState<RealtimeDevice[]>(fallbackDevices)
  const [selectedDevice, setSelectedDevice] = useState<RealtimeDevice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await telemetryApi.getRealtimeAll()
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDevices(res.data)
        }
      } catch {
        // use fallback
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    try {
      const res = await telemetryApi.getRealtimeAll()
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDevices(res.data)
      }
    } catch {
      // keep current data
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 112px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>
          <Space>
            <span style={{ color: '#00d2ff' }}>|</span>
            3D Workshop Visualization
          </Space>
        </Title>
        <Space>
          <Tooltip title="Refresh data">
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          </Tooltip>
          <Space style={{ marginLeft: 16 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#00ff88' }} />
            <AntText style={{ color: '#8892b0', fontSize: 12 }}>Online</AntText>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ffaa00', marginLeft: 8 }} />
            <AntText style={{ color: '#8892b0', fontSize: 12 }}>Warning</AntText>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ff4757', marginLeft: 8 }} />
            <AntText style={{ color: '#8892b0', fontSize: 12 }}>Fault</AntText>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#444', marginLeft: 8 }} />
            <AntText style={{ color: '#8892b0', fontSize: 12 }}>Offline</AntText>
          </Space>
        </Space>
      </div>

      <Card
        style={{
          height: 'calc(100% - 56px)',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid #2a2a4a',
        }}
        styles={{ body: { padding: 0, height: '100%' } }}
      >
        <Canvas
          camera={{ position: [20, 15, 20], fov: 50 }}
          shadows
          style={{ background: '#080818' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
          <pointLight position={[-10, 10, -10]} intensity={0.3} color="#00d2ff" />
          <pointLight position={[10, 10, 10]} intensity={0.3} color="#00ff88" />

          <FloorGrid />

          {/* Workshop labels */}
          <WorkshopLabel position={[-10, 6, -8]} name="Workshop A - Machining" />
          <WorkshopLabel position={[2, 6, -8]} name="Workshop B - Assembly" />
          <WorkshopLabel position={[14, 6, -8]} name="Workshop C - Heat Treatment" />

          {/* Separator lines */}
          <mesh position={[-6, 0.05, 0]}>
            <boxGeometry args={[0.1, 0.1, 20]} />
            <meshStandardMaterial color="#2a2a4a" />
          </mesh>
          <mesh position={[6, 0.05, 0]}>
            <boxGeometry args={[0.1, 0.1, 20]} />
            <meshStandardMaterial color="#2a2a4a" />
          </mesh>

          <Suspense fallback={null}>
            {devices.map((device, index) => (
              <DeviceModel
                key={device.device_id}
                device={device}
                index={index}
                onClick={() => setSelectedDevice(selectedDevice?.device_id === device.device_id ? null : device)}
              />
            ))}

            {selectedDevice && (
              <DeviceInfoPanel
                device={selectedDevice}
                onClose={() => setSelectedDevice(null)}
              />
            )}
          </Suspense>

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
      </Card>
    </div>
  )
}
