'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Divider, Form, Input, Typography, App } from 'antd'
import { GoogleOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { ApiError, apiClient } from '@/lib/api-client'

const { Title, Text } = Typography

interface LoginFormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { message: messageApi } = App.useApp()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      const user = await login(values.email, values.password)
      if (!user.isVerified) {
        router.push(`/verify?email=${encodeURIComponent(user.email)}`)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Login failed'
      messageApi.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          Sign In
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Welcome back! Please sign in to continue.
        </Text>

        <Form<LoginFormValues> layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>or</Divider>

        <Button
          icon={<GoogleOutlined />}
          block
          size="large"
          href={apiClient.getUrl('/auth/google')}
        >
          Continue with Google
        </Button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Don&apos;t have an account? <Link href="/register">Sign up</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
