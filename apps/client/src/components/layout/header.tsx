'use client'

import { useRouter } from 'next/navigation'
import { Layout, Button, Typography, Space, Avatar, App } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '@/hooks/use-auth'

const { Text } = Typography

export function Header() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { message: messageApi } = App.useApp()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch {
      messageApi.error('Failed to logout')
    }
  }

  return (
    <Layout.Header
      style={{
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Text strong style={{ fontSize: 18 }}>
        Auth Service
      </Text>

      {user && (
        <Space>
          <Avatar
            size="small"
            src={user.avatarUrl}
            icon={!user.avatarUrl ? <UserOutlined /> : undefined}
          />
          <Text>{user.username}</Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      )}
    </Layout.Header>
  )
}
