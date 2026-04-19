export interface SessionUser {
  id: string
  email: string
  username: string
  isVerified: boolean
  avatarUrl: string | null
  createdAt: Date
}
