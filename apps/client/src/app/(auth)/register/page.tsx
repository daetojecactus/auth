'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Form, Input, Typography, App } from 'antd'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { ApiError } from '@/lib/api-client'

const { Title, Text } = Typography

interface RegisterFormValues {
  email: string
  username: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { message: messageApi } = App.useApp()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true)
    try {
      await register(values.email, values.username, values.password)
      messageApi.success('Registration successful! Please check your email.')
      router.push(`/verify?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Registration failed'
      messageApi.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          Create Account
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Sign up to get started.
        </Text>

        <Form<RegisterFormValues> layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
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
            name="username"
            rules={[
              { required: true, message: 'Please enter a username' },
              { min: 3, message: 'Username must be at least 3 characters' },
              { max: 30, message: 'Username must be at most 30 characters' },
              {
                pattern: /^[a-zA-Z0-9_-]+$/,
                message: 'Only letters, numbers, underscores and hyphens',
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign Up
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Already have an account? <Link href="/login">Sign in</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
