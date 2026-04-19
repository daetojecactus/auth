import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly config: ConfigService) {
    super()
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('OAuth authentication failed')
    }
    return user as TUser
  }
}
