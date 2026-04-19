import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import { RedisService } from '../../redis/redis.service.js'
import { SessionConstants } from './constants/session.constants.js'
import type { SessionData, SessionInfo } from './session.types.js'

@Injectable()
export class SessionService {
  private readonly ttl: number

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.ttl = this.config.get<number>('SESSION_TTL', 604800)
  }

  async create(data: Omit<SessionData, 'createdAt'>): Promise<string> {
    const sessionId = randomBytes(32).toString('hex')
    const session: SessionData = {
      ...data,
      createdAt: Date.now(),
    }

    await this.redis.set(
      `${SessionConstants.PREFIX}${sessionId}`,
      JSON.stringify(session),
      'EX',
      this.ttl,
    )
    await this.redis.sadd(`${SessionConstants.USER_SESSIONS_PREFIX}${data.userId}`, sessionId)

    return sessionId
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const raw = await this.redis.get(`${SessionConstants.PREFIX}${sessionId}`)
    if (!raw) return null
    return JSON.parse(raw) as SessionData
  }

  async delete(sessionId: string): Promise<void> {
    const session = await this.get(sessionId)
    if (session) {
      await this.redis.srem(`${SessionConstants.USER_SESSIONS_PREFIX}${session.userId}`, sessionId)
    }
    await this.redis.del(`${SessionConstants.PREFIX}${sessionId}`)
  }

  async touch(sessionId: string): Promise<void> {
    await this.redis.expire(`${SessionConstants.PREFIX}${sessionId}`, this.ttl)
  }

  async getAllForUser(userId: string, currentSessionId: string): Promise<SessionInfo[]> {
    const sessionIds = await this.redis.smembers(
      `${SessionConstants.USER_SESSIONS_PREFIX}${userId}`,
    )
    if (sessionIds.length === 0) return []

    const sessions: SessionInfo[] = []
    const staleIds: string[] = []

    for (const id of sessionIds) {
      const data = await this.get(id)
      if (!data) {
        staleIds.push(id)
        continue
      }
      sessions.push({
        id,
        ip: data.ip,
        userAgent: data.userAgent,
        createdAt: data.createdAt,
        isCurrent: id === currentSessionId,
      })
    }

    if (staleIds.length > 0) {
      await this.redis.srem(`${SessionConstants.USER_SESSIONS_PREFIX}${userId}`, ...staleIds)
    }

    return sessions.sort((a, b) => b.createdAt - a.createdAt)
  }

  async deleteForUser(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.get(sessionId)
    if (!session || session.userId !== userId) return false

    await this.delete(sessionId)
    return true
  }

  async deleteAllExcept(userId: string, keepSessionId: string): Promise<number> {
    const sessionIds = await this.redis.smembers(
      `${SessionConstants.USER_SESSIONS_PREFIX}${userId}`,
    )
    const toDelete = sessionIds.filter((id) => id !== keepSessionId)

    if (toDelete.length === 0) return 0

    const keys = toDelete.map((id) => `${SessionConstants.PREFIX}${id}`)
    await this.redis.del(...keys)
    await this.redis.srem(`${SessionConstants.USER_SESSIONS_PREFIX}${userId}`, ...toDelete)

    return toDelete.length
  }
}
