import { Module } from '@nestjs/common'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { AppConfigModule } from './config/config.module.js'
import { LoggerModule } from './logger/logger.module.js'
import { ThrottlerModule } from './throttler/throttler.module.js'
import { DatabaseModule } from './database/database.module.js'
import { RedisModule } from './redis/redis.module.js'
import { HealthModule } from './health/health.module.js'
import { ApplicationModule } from './application/application.module.js'
import { ApiModule } from './api/api.module.js'
import { AuthGuard } from '../common/guards/auth.guard.js'
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js'

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    ThrottlerModule,
    DatabaseModule,
    RedisModule,
    HealthModule,
    ApplicationModule,
    ApiModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
