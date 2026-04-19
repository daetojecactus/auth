'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, Form, Input, Typography, App, Space, Spin } from 'antd'
import { MailOutlined, SafetyOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { ApiError } from '@/lib/api-client'

const { Title, Text } = Typography

interface VerifyFormValues {
  code: string
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}


function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const { verify, resendCode } = useAuth()
  const { message: messageApi } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!email) {
      router.replace('/register')
    }
  }, [email, router])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const onFinish = async (values: VerifyFormValues) => {
    setLoading(true)
    try {
      await verify(email, values.code)
      messageApi.success('Email verified successfully! Please sign in.')
      router.push('/login')
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Verification failed'
      messageApi.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await resendCode(email)
      messageApi.success('Verification code sent!')
      setCooldown(60)
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Failed to resend code'
      messageApi.error(msg)
    } finally {
      setResending(false)
    }
  }

  if (!email) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          Verify Your Email
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 8 }}>
          We sent a 6-digit code to
        </Text>
        <Text strong style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          <MailOutlined /> {email}
        </Text>

        <Form<VerifyFormValues> layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="code"
            rules={[
              { required: true, message: 'Please enter the verification code' },
              { len: 6, message: 'Code must be exactly 6 digits' },
              { pattern: /^\d+$/, message: 'Code must contain only digits' },
            ]}
          >
            <Input
              prefix={<SafetyOutlined />}
              placeholder="000000"
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20 }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Verify
            </Button>
          </Form.Item>
        </Form>

        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
          <Button
            type="link"
            onClick={handleResend}
            loading={resending}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
          </Button>
          <Text type="secondary">
            <Link href="/login">Back to Sign In</Link>
          </Text>
        </Space>
      </Card>
    </div>
  )
}
