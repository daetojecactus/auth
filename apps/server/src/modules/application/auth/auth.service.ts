import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import argon2 from 'argon2'
import { randomInt } from 'crypto'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../user/user.service.js'
import { SessionService } from '../session/session.service.js'
import { RedisService } from '../../infrastructure/redis/redis.service.js'
import { NotificationService } from '../notifications/notification.service.js'
import { RegisterDto } from './dto/register.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { VerifyDto } from './dto/verify.dto.js'
import { ResendCodeDto } from './dto/resend-code.dto.js'
import { ChangePasswordDto } from './dto/change-password.dto.js'
import { AuthConstants, AuthMessage } from './constants/auth.constants.js'
import type { AppEnvs } from '../../infrastructure/config/env.js'
import type { OAuthCallbackProfile } from '../user/user.types.js'

@Injectable()
export class AuthService {
  private readonly pepper: string

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly redis: RedisService,
    private readonly notificationService: NotificationService,
    config: ConfigService<AppEnvs, true>,
  ) {
    this.pepper = config.get('SESSION_SECRET')
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      secret: Buffer.from(this.pepper),
    })
  }

  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password, {
      secret: Buffer.from(this.pepper),
    })
  }

  async register(dto: RegisterDto) {
    const [existingEmail, existingUsername] = await Promise.all([
      this.userService.findOne({ email: dto.email }),
      this.userService.findOne({ username: dto.username }),
    ])

    if (existingEmail) {
      throw new ConflictException(AuthMessage.EMAIL_ALREADY_EXISTS)
    }

    if (existingUsername) {
      throw new ConflictException(AuthMessage.USERNAME_TAKEN)
    }

    const hashedPassword = await this.hashPassword(dto.password)

    const user = await this.userService.create({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
    })

    await this.generateAndSendCode(dto.email)

    return {
      message: AuthMessage.REGISTER_SUCCESS,
      user,
    }
  }

  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.userService.findOne({ email: dto.email })

    if (!user || !user.password) {
      await this.hashPassword('dummy-password-timing-safe')
      throw new UnauthorizedException(AuthMessage.INVALID_CREDENTIALS)
    }

    const isPasswordValid = await this.verifyPassword(user.password, dto.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException(AuthMessage.INVALID_CREDENTIALS)
    }

    const sessionId = await this.sessionService.create({
      userId: user.id,
      ip,
      userAgent,
    })

    return {
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
    }
  }

  async logout(sessionId: string) {
    await this.sessionService.delete(sessionId)
  }

  async verify(dto: VerifyDto) {
    const storedCode = await this.redis.get(`${AuthConstants.VERIFY_PREFIX}${dto.email}`)

    if (!storedCode || storedCode !== dto.code) {
      throw new BadRequestException(AuthMessage.INVALID_VERIFICATION_CODE)
    }

    const user = await this.userService.findOne({ email: dto.email })
    if (!user) {
      throw new BadRequestException(AuthMessage.INVALID_VERIFICATION_CODE)
    }

    if (user.isVerified) {
      await this.redis.del(`${AuthConstants.VERIFY_PREFIX}${dto.email}`)
      return { message: AuthMessage.ALREADY_VERIFIED }
    }

    await this.userService.update(user.id, { isVerified: true })
    await this.redis.del(`${AuthConstants.VERIFY_PREFIX}${dto.email}`)

    return { message: AuthMessage.VERIFY_SUCCESS }
  }

  async resendCode(dto: ResendCodeDto) {
    const user = await this.userService.findOne({ email: dto.email })

    if (!user || user.isVerified) {
      return { message: AuthMessage.RESEND_CODE_SUCCESS }
    }

    await this.generateAndSendCode(dto.email)

    return { message: AuthMessage.RESEND_CODE_SUCCESS }
  }

  private async generateAndSendCode(email: string): Promise<void> {
    const code = randomInt(100000, 999999).toString()
    await this.redis.set(
      `${AuthConstants.VERIFY_PREFIX}${email}`,
      code,
      AuthConstants.VERIFY_TTL,
    )
    await this.notificationService.sendVerificationCode(email, code)
  }

  async googleLogin(profile: OAuthCallbackProfile, ip: string, userAgent: string) {
    const user = await this.userService.findOrCreateOAuthUser({
      ...profile,
      provider: 'google',
    })

    const sessionId = await this.sessionService.create({
      userId: user.id,
      ip,
      userAgent,
    })

    return { sessionId, user }
  }

  async changePassword(dto: ChangePasswordDto, userId: string, currentSessionId: string) {
    const user = await this.userService.findOne({ id: userId })

    if (!user || !user.password) {
      throw new BadRequestException(AuthMessage.PASSWORD_CHANGE_UNAVAILABLE)
    }

    const isCurrentValid = await this.verifyPassword(user.password, dto.currentPassword)
    if (!isCurrentValid) {
      throw new BadRequestException(AuthMessage.CURRENT_PASSWORD_INCORRECT)
    }

    const hashedNew = await this.hashPassword(dto.newPassword)

    await this.userService.update(userId, { password: hashedNew })

    const revoked = await this.sessionService.deleteAllExcept(userId, currentSessionId)

    return {
      message: AuthMessage.PASSWORD_CHANGED,
      revokedSessions: revoked,
    }
  }

  async getSessions(userId: string, currentSessionId: string) {
    return this.sessionService.getAllForUser(userId, currentSessionId)
  }

  async revokeSession(sessionId: string, userId: string) {
    const deleted = await this.sessionService.deleteForUser(sessionId, userId)
    if (!deleted) {
      throw new BadRequestException(AuthMessage.SESSION_NOT_FOUND)
    }
    return { message: AuthMessage.SESSION_REVOKED }
  }
}
