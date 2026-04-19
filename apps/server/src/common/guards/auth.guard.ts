import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js'
import { GuardMessage } from '../constants/guard.messages.js'
import { SessionService } from '../../modules/application/session/session.service.js'
import { UserService } from '../../modules/application/user/user.service.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly session: SessionService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<Request>()
    const sessionId = request.cookies?.['session_id']

    if (!sessionId) {
      throw new UnauthorizedException(GuardMessage.SESSION_NOT_FOUND)
    }

    const sessionData = await this.session.get(sessionId)
    if (!sessionData) {
      throw new UnauthorizedException(GuardMessage.SESSION_INVALID)
    }

    // 7.2 — Validate User-Agent binding
    const currentUA = request.headers['user-agent'] || 'unknown'
    if (sessionData.userAgent !== 'unknown' && sessionData.userAgent !== currentUA) {
      await this.session.delete(sessionId)
      throw new UnauthorizedException(GuardMessage.SESSION_CLIENT_MISMATCH)
    }

    const user = await this.userService.findSafe({ id: sessionData.userId })

    if (!user) {
      await this.session.delete(sessionId)
      throw new UnauthorizedException(GuardMessage.USER_NOT_FOUND)
    }

    // 7.6 — Sliding expiration: refresh TTL on every authenticated request
    await this.session.touch(sessionId)

    request.user = user
    request.sessionId = sessionId

    return true
  }
}
