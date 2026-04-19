import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { Response } from 'express'
import { Public } from '../../common/decorators/public.decorator.js'
import { DatabaseService } from '../database/database.service.js'
import { RedisService } from '../redis/redis.service.js'

@Controller('health')
@Public()
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' }
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const checks: Record<string, string> = {}
    let healthy = true

    try {
      await this.db.$queryRaw`SELECT 1`
      checks.database = 'connected'
    } catch {
      checks.database = 'disconnected'
      healthy = false
    }

    try {
      await this.redis.ping()
      checks.redis = 'connected'
    } catch {
      checks.redis = 'disconnected'
      healthy = false
    }

    const status = healthy ? 'ok' : 'degraded'
    if (!healthy) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
    }

    return { status, ...checks }
  }

  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    return this.ready(res)
  }
}
