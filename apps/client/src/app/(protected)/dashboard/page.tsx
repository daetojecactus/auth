'use client'

import { Typography, Card, Descriptions, Tag } from 'antd'
import { useAuth } from '@/hooks/use-auth'
import { Header } from '@/components/layout/header'

const { Title, Text } = Typography

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div>
      <Header />
      <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        <Title level={3}>Dashboard</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Welcome back, {user.username}!
        </Text>

        <Card title="Account Information">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="User ID">
              <Text copyable={{ text: user.id }}>{user.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Username">{user.username}</Descriptions.Item>
            <Descriptions.Item label="Verified">
              {user.isVerified ? (
                <Tag color="green">Verified</Tag>
              ) : (
                <Tag color="orange">Not verified</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Member since">
              {new Date(user.createdAt).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </main>
    </div>
  )
}
