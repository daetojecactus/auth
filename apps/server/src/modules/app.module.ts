import { Module } from '@nestjs/common'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { AppConfigModule } from './infrastructure/config/config.module.js'
import { InfrastructureModule } from './infrastructure/infrastructure.module.js'
import { ApplicationModule } from './application/application.module.js'
import { ApiModule } from './api/api.module.js'
import { AuthGuard } from '../common/guards/auth.guard.js'
import { HttpExceptionFilter } from '../common/filters/http-exception.filter.js'

@Module({
  imports: [AppConfigModule, InfrastructureModule, ApplicationModule, ApiModule],
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
