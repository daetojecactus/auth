import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import type { AppEnvs } from '../config/env.js'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis

  constructor(config: ConfigService<AppEnvs, true>) {
    this.client = new Redis({
      host: config.get('REDIS_HOST'),
      port: config.get('REDIS_PORT'),
    })
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<string> {
    if (ttl) {
      return this.client.set(key, value, 'EX', ttl)
    }
    return this.client.set(key, value)
  }

  async del(...keys: string[]): Promise<number> {
    return this.client.del(...keys)
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members)
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members)
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key)
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds)
  }

  async ping(): Promise<string> {
    return this.client.ping()
  }

  async onModuleDestroy() {
    await this.client.quit()
  }
}
