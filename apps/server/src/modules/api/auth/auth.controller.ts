import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../../application/auth/auth.service.js'
import { RegisterDto } from '../../application/auth/dto/register.dto.js'
import { LoginDto } from '../../application/auth/dto/login.dto.js'
import { VerifyDto } from '../../application/auth/dto/verify.dto.js'
import { ResendCodeDto } from '../../application/auth/dto/resend-code.dto.js'
import { ChangePasswordDto } from '../../application/auth/dto/change-password.dto.js'
import { Public } from '../../../common/decorators/public.decorator.js'
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js'
import { COOKIE_NAME, getSessionCookieOptions } from '../../../common/utils/cookie.js'
import { GoogleOAuthGuard } from '../../application/auth/guards/google-oauth.guard.js'
import { AuthMessage } from '../../application/auth/constants/auth.constants.js'
import { Environment } from '../../infrastructure/config/environment.enum.js'
import type { AppEnvs } from '../../infrastructure/config/env.js'
import type { SessionUser } from '../../../common/interfaces/session-user.interface.js'
import type { OAuthCallbackProfile } from '../../application/user/user.types.js'

@Controller('auth')
export class AuthController {
  private readonly sessionTtl: number
  private readonly isProduction: boolean
  private readonly clientUrl: string

  constructor(
    private readonly authService: AuthService,
    config: ConfigService<AppEnvs, true>,
  ) {
    this.sessionTtl = config.get('SESSION_TTL')
    this.isProduction = config.get('NODE_ENV') === Environment.PRODUCTION
    this.clientUrl = config.get('CLIENT_URL')
  }

  @Post('register')
  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @Public()
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    const existingSessionId = req.cookies?.[COOKIE_NAME]
    if (existingSessionId) {
      await this.authService.logout(existingSessionId)
    }

    const result = await this.authService.login(dto, ip, userAgent)

    res.cookie(
      COOKIE_NAME,
      result.sessionId,
      getSessionCookieOptions(this.sessionTtl, this.isProduction),
    )

    return { user: result.user }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.[COOKIE_NAME]
    if (sessionId) {
      await this.authService.logout(sessionId)
    }

    res.clearCookie(COOKIE_NAME, { path: '/' })

    return { message: AuthMessage.LOGGED_OUT }
  }

  @Get('session')
  @HttpCode(HttpStatus.OK)
  async session(@CurrentUser() user: SessionUser) {
    return { user }
  }

  @Post('verify')
  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verify(dto)
  }

  @Post('resend-code')
  @Public()
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() dto: ResendCodeDto) {
    return this.authService.resendCode(dto)
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getSessions(@CurrentUser() user: SessionUser, @Req() req: Request) {
    return this.authService.getSessions(user.id, req.sessionId!)
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: SessionUser,
    @Req() req: Request,
  ) {
    if (sessionId === req.sessionId) {
      return { message: AuthMessage.CANNOT_REVOKE_CURRENT }
    }
    return this.authService.revokeSession(sessionId, user.id)
  }

  @Post('change-password')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: SessionUser,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(dto, user.id, req.sessionId!)
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Guard redirects to Google consent screen
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const profile = req.user as unknown as OAuthCallbackProfile

      if (!profile?.providerAccountId) {
        return res.redirect(`${this.clientUrl}/login?error=oauth_failed`)
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown'
      const userAgent = req.headers['user-agent'] || 'unknown'

      const result = await this.authService.googleLogin(profile, ip, userAgent)

      res.cookie(
        COOKIE_NAME,
        result.sessionId,
        getSessionCookieOptions(this.sessionTtl, this.isProduction),
      )
      res.redirect(`${this.clientUrl}/dashboard`)
    } catch {
      if (!res.headersSent) {
        res.redirect(`${this.clientUrl}/login?error=oauth_failed`)
      }
    }
  }
}
