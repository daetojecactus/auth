import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
    })
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, exMode: 'EX', ttl: number): Promise<string>
  async set(key: string, value: string): Promise<string>
  async set(key: string, value: string, ...args: (string | number)[]): Promise<string> {
    if (args.length === 0) {
      return this.client.set(key, value)
    }
    const [mode, ttl] = args
    if (mode === 'EX' && typeof ttl === 'number') {
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
