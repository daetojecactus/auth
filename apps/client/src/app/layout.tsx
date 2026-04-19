import type { Metadata } from 'next'
import { AntdProvider } from '@/providers/antd-provider'
import { AuthProvider } from '@/providers/auth-provider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Auth',
  description: 'Authentication service',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdProvider>
          <AuthProvider>{children}</AuthProvider>
        </AntdProvider>
      </body>
    </html>
  )
}
