import { Tag } from 'antd'
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'

type StatusType = 'online' | 'warning' | 'fault' | 'offline'

interface StatusTagProps {
  status: StatusType | string
  showIcon?: boolean
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  online: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: 'Online',
  },
  warning: {
    color: 'warning',
    icon: <WarningOutlined />,
    label: 'Warning',
  },
  fault: {
    color: 'error',
    icon: <CloseCircleOutlined />,
    label: 'Fault',
  },
  offline: {
    color: 'default',
    icon: <MinusCircleOutlined />,
    label: 'Offline',
  },
}

export default function StatusTag({ status, showIcon = true }: StatusTagProps) {
  const config = statusConfig[status] || {
    color: 'default',
    icon: <MinusCircleOutlined />,
    label: status,
  }

  return (
    <Tag color={config.color} icon={showIcon ? config.icon : undefined}>
      {config.label}
    </Tag>
  )
}
