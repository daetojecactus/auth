import type { User } from '../../infrastructure/database/generated/prisma/client.js'

export type SafeUser = Omit<User, 'password' | 'updatedAt'>

export interface OAuthProfile {
  provider: string
  providerAccountId: string
  email: string
  username: string
  avatarUrl: string | null
}

export type OAuthCallbackProfile = Omit<OAuthProfile, 'provider'>
