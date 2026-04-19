export interface OAuthProfile {
  provider: string
  providerAccountId: string
  email: string
  username: string
  avatarUrl: string | null
}

export type OAuthCallbackProfile = Omit<OAuthProfile, 'provider'>
