import { Module } from '@nestjs/common'
import { DatabaseModule } from './database/database.module.js'
import { RedisModule } from './redis/redis.module.js'
import { MailModule } from './mail/mail.module.js'
import { LoggerModule } from './logger/logger.module.js'
import { ThrottlerModule } from './throttler/throttler.module.js'
import { HealthModule } from './health/health.module.js'

@Module({
  imports: [DatabaseModule, RedisModule, MailModule, HealthModule, LoggerModule, ThrottlerModule],
})
export class InfrastructureModule {}
