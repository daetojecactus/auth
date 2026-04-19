import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service.js'
import { UserModule } from '../user/user.module.js'
import { NotificationModule } from '../notifications/notification.module.js'
import { GoogleStrategy } from './strategies/google.strategy.js'
import type { AppEnvs } from '../../infrastructure/config/env.js'

const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (config: ConfigService<AppEnvs, true>) => {
    const clientId = config.get('GOOGLE_CLIENT_ID', { infer: true })
    const clientSecret = config.get('GOOGLE_CLIENT_SECRET', { infer: true })
    const callbackUrl = config.get('GOOGLE_CALLBACK_URL', { infer: true })
    if (!clientId || !clientSecret || !callbackUrl) return null
    return new GoogleStrategy(clientId, clientSecret, callbackUrl)
  },
  inject: [ConfigService],
}

@Module({
  imports: [PassportModule, UserModule, NotificationModule],
  providers: [AuthService, googleStrategyProvider],
  exports: [AuthService],
})
export class AuthModule {}
