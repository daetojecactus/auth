import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../../infrastructure/database/database.service.js'
import type { User, Prisma } from '../../infrastructure/database/generated/prisma/client.js'
import type { SafeUser, OAuthProfile } from './user.types.js'

const SAFE_USER_OMIT = { password: true, updatedAt: true } as const

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async findOne(where: Prisma.UserWhereInput): Promise<User | null> {
    return this.db.user.findFirst({ where })
  }

  async findSafe(where: Prisma.UserWhereInput): Promise<SafeUser | null> {
    return this.db.user.findFirst({ where, omit: SAFE_USER_OMIT })
  }

  async create(data: Prisma.UserCreateInput): Promise<SafeUser> {
    return this.db.user.create({ data, omit: SAFE_USER_OMIT })
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<SafeUser> {
    return this.db.user.update({ where: { id }, data, omit: SAFE_USER_OMIT })
  }

  async findOrCreateOAuthUser(profile: OAuthProfile): Promise<SafeUser> {
    const existingAccount = await this.db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: { omit: SAFE_USER_OMIT } },
    })

    if (existingAccount) {
      if (profile.avatarUrl && existingAccount.user.avatarUrl !== profile.avatarUrl) {
        return this.update(existingAccount.user.id, { avatarUrl: profile.avatarUrl })
      }
      return existingAccount.user
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
        return this.update(existingUser.id, { isVerified: true })
      }

      const { password: _, updatedAt: __, ...safeUser } = existingUser
      return safeUser
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
      omit: SAFE_USER_OMIT,
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
