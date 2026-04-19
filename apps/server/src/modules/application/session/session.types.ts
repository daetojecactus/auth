export interface SessionData {
  userId: string
  ip: string
  userAgent: string
  createdAt: number
}

export interface SessionInfo {
  id: string
  ip: string
  userAgent: string
  createdAt: number
  isCurrent: boolean
}
