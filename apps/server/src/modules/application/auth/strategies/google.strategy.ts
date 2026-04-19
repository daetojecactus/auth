import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback, Profile, StrategyOptions } from 'passport-google-oauth20'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    super({
      clientID: clientId,
      clientSecret,
      callbackURL: callbackUrl,
      scope: ['email', 'profile'],
    } as StrategyOptions)
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile

    const user = {
      providerAccountId: id,
      email: emails?.[0]?.value,
      username: displayName,
      avatarUrl: photos?.[0]?.value || null,
    }

    done(null, user)
  }
}
