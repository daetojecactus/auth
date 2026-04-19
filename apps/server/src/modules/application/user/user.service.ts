import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service.js'
import type { OAuthProfile } from './user.types.js'

const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  isVerified: true,
  avatarUrl: true,
  createdAt: true,
} as const

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } })
  }

  async findByUsername(username: string) {
    return this.db.user.findUnique({ where: { username } })
  }

  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: USER_SELECT,
    })
  }

  async findByIdWithPassword(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: { ...USER_SELECT, password: true },
    })
  }

  async create(data: { email: string; username: string; password: string }) {
    return this.db.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        isVerified: false,
      },
      select: USER_SELECT,
    })
  }

  async update(id: string, data: { isVerified?: boolean; password?: string }) {
    return this.db.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    })
  }

  async findOrCreateOAuthUser(profile: OAuthProfile) {
    const existingAccount = await this.db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    })

    if (existingAccount) {
      if (profile.avatarUrl && existingAccount.user.avatarUrl !== profile.avatarUrl) {
        await this.db.user.update({
          where: { id: existingAccount.user.id },
          data: { avatarUrl: profile.avatarUrl },
        })
      }

      return {
        id: existingAccount.user.id,
        email: existingAccount.user.email,
        username: existingAccount.user.username,
        isVerified: existingAccount.user.isVerified,
        avatarUrl: profile.avatarUrl || existingAccount.user.avatarUrl,
      }
    }

    const existingUser = await this.db.user.findUnique({
      where: { email: profile.email },
    })

    if (existingUser) {
      await this.db.account.create({
        data: {
          userId: existingUser.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      })

      if (!existingUser.isVerified) {
        await this.db.user.update({
          where: { id: existingUser.id },
          data: { isVerified: true },
        })
      }

      return {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        isVerified: true,
        avatarUrl: existingUser.avatarUrl || profile.avatarUrl,
      }
    }

    const username = await this.generateUniqueUsername(profile.username)

    return this.db.user.create({
      data: {
        email: profile.email,
        username,
        password: null,
        isVerified: true,
        avatarUrl: profile.avatarUrl,
        accounts: {
          create: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
      },
      select: USER_SELECT,
    })
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    const sanitized = base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25)
    const candidate = sanitized || 'user'

    const existing = await this.db.user.findUnique({
      where: { username: candidate },
    })

    if (!existing) return candidate

    const suffix = Math.floor(Math.random() * 10000)
    return `${candidate}_${suffix}`
  }
}
