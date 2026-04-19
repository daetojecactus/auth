import { Module } from '@nestjs/common'
import { SessionModule } from './session/session.module.js'
import { UserModule } from './user/user.module.js'
import { NotificationModule } from './notifications/notification.module.js'
import { AuthModule } from './auth/auth.module.js'

@Module({
  imports: [SessionModule, UserModule, NotificationModule, AuthModule],
  exports: [SessionModule, UserModule, NotificationModule, AuthModule],
})
export class ApplicationModule {}
