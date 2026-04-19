import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js'
import { GuardMessage } from '../constants/guard.messages.js'

@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) return true // AuthGuard hasn't run yet or route is public

    if (!user.isVerified) {
      throw new ForbiddenException(
        GuardMessage.EMAIL_NOT_VERIFIED,
      )
    }

    return true
  }
}
