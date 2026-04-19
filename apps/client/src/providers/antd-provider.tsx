'use client'

import { ConfigProvider, App } from 'antd'

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
