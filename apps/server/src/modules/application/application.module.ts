import { Module } from '@nestjs/common'
import { SessionModule } from './session/session.module.js'
import { UserModule } from './user/user.module.js'
import { MailModule } from './mail/mail.module.js'
import { AuthModule } from './auth/auth.module.js'

@Module({
  imports: [SessionModule, UserModule, MailModule, AuthModule],
  exports: [SessionModule, UserModule, MailModule, AuthModule],
})
export class ApplicationModule {}
