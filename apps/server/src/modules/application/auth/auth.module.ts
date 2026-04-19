import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service.js'
import { UserModule } from '../user/user.module.js'
import { MailModule } from '../mail/mail.module.js'
import { GoogleStrategy } from './strategies/google.strategy.js'

const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (config: ConfigService) => {
    const clientId = config.get<string>('GOOGLE_CLIENT_ID')
    if (!clientId) return null
    return new GoogleStrategy(config)
  },
  inject: [ConfigService],
}

@Module({
  imports: [PassportModule, UserModule, MailModule],
  providers: [AuthService, googleStrategyProvider],
  exports: [AuthService],
})
export class AuthModule {}
