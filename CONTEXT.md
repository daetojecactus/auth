# Auth Service — Архитектурный контекст

## 1. Обзор проекта

Промышленный сервис аутентификации и авторизации, построенный по принципам OWASP Best Practices. Монорепо на базе pnpm workspaces с разделением на серверную и клиентскую части.

## 2. Стек технологий

| Слой                 | Технология                                      | Обоснование                                                       |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| **Монорепо**         | pnpm 10.33 workspaces                           | Единый lockfile, строгий hoisting, быстрая установка              |
| **Backend**          | NestJS 11, TypeScript 6, Node.js 24 (ESM)       | Модульная архитектура, DI из коробки, декораторы для Guards/Pipes |
| **Frontend**         | Next.js 16 (App Router), React 19, Ant Design 6 | SSR/SSG, встроенный routing, зрелая UI-библиотека                 |
| **Database**         | PostgreSQL 17                                   | ACID, надёжность, jsonb для метаданных сессий                     |
| **ORM**              | Prisma 7 (driver adapters, @prisma/adapter-pg)  | Type-safe запросы, автогенерация клиента, миграции                |
| **Cache / Sessions** | Redis 7 (ioredis)                               | In-memory хранилище сессий, TTL для кодов верификации             |
| **Контейнеризация**  | Docker Compose                                  | Изолированные сервисы БД и кеша для dev-окружения                 |

## 3. Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                     │
│                     http://localhost:3000                    │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Pages   │  │  Providers   │  │  API Client (fetch) │    │
│  │ (App     │  │  (Antd,      │  │  credentials:       │    │
│  │  Router) │  │   Auth)      │  │  'include'          │    │
│  └──────────┘  └──────────────┘  └─────────┬──────────┘    │
└────────────────────────────────────────────┬────────────────┘
                                             │ REST API
                                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Server (NestJS)                          │
│                   http://localhost:4000                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Controllers │  │   Guards     │  │   Middleware     │   │
│  │  (REST API)  │  │  (Auth,Role) │  │  (CORS,Helmet)  │   │
│  └──────┬───────┘  └──────────────┘  └─────────────────┘   │
│         │                                                    │
│  ┌──────▼───────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Services   │  │  Session     │  │   OAuth 2.0     │   │
│  │  (Business   │  │  Manager     │  │   (Google)      │   │
│  │   Logic)     │  │  (Redis)     │  │                 │   │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘   │
│         │                 │                                   │
│  ┌──────▼───────┐  ┌──────▼───────┐                         │
│  │   Prisma     │  │    Redis     │                         │
│  │  (PostgreSQL)│  │   (ioredis)  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 4. Потоки данных (Flows)

### 4.1 Классическая регистрация (Email + Password)

```
Client                    Server                    Redis           PostgreSQL       Email
  │                         │                         │                │               │
  ├─ POST /api/auth/register ─►                       │                │               │
  │   {email, password,     │                         │                │               │
  │    username}            │                         │                │               │
  │                         ├─ validate input ────────┤                │               │
  │                         ├─ check duplicate ───────┼────────────────►               │
  │                         ├─ hash password (argon2) │                │               │
  │                         ├─ create user ───────────┼────────────────►               │
  │                         │   (isVerified: false)   │                │               │
  │                         ├─ generate 6-digit code  │                │               │
  │                         ├─ store code ────────────►  TTL: 10 min  │               │
  │                         ├─ send verification ─────┼────────────────┼───────────────►
  │                         │                         │                │               │
  ◄─── 201 { message }─────┤                         │                │               │
```

### 4.2 Email Verification

```
Client                    Server                    Redis           PostgreSQL
  │                         │                         │                │
  ├─ POST /api/auth/verify  │                         │                │
  │   {email, code}         │                         │                │
  │                         ├─ lookup code ───────────►                │
  │                         ├─ compare codes          │                │
  │                         ├─ delete code ───────────►                │
  │                         ├─ update user ───────────┼────────────────►
  │                         │   (isVerified: true)    │                │
  │                         ├─ create session ────────►                │
  │                         │                         │                │
  ◄─── 200 + Set-Cookie ───┤                         │                │
  │   (httpOnly, secure,    │                         │                │
  │    sameSite: lax)       │                         │                │
```

### 4.3 Логин (Email + Password)

```
Client                    Server                    Redis           PostgreSQL
  │                         │                         │                │
  ├─ POST /api/auth/login   │                         │                │
  │   {email, password}     │                         │                │
  │                         ├─ find user ─────────────┼────────────────►
  │                         ├─ verify password (argon2)│               │
  │                         ├─ check isVerified       │                │
  │                         ├─ create session ────────►  TTL: 7 days  │
  │                         │   {userId, ua, ip}      │                │
  │                         │                         │                │
  ◄─── 200 + Set-Cookie ───┤                         │                │
  │   (sessionId)           │                         │                │
```

### 4.4 OAuth 2.0 (Google)

```
Client                    Server                    Google          PostgreSQL    Redis
  │                         │                         │                │            │
  ├─ GET /api/auth/google ──►                         │                │            │
  │                         ├─ redirect ──────────────►                │            │
  │                         │   (authorization URL)   │                │            │
  ◄─── 302 redirect ───────┤                         │                │            │
  │                         │                         │                │            │
  ├─ (user consent) ────────┼─────────────────────────►                │            │
  │                         │                         │                │            │
  ├─ GET /api/auth/google/callback?code=xxx ──────────►                │            │
  │                         ├─ exchange code ─────────►                │            │
  │                         ◄─── tokens + profile ────┤                │            │
  │                         ├─ find or create user ───┼────────────────►            │
  │                         ├─ create session ────────┼────────────────┼────────────►
  │                         │                         │                │            │
  ◄─── 302 + Set-Cookie ───┤                         │                │            │
  │   (redirect to client)  │                         │                │            │
```

### 4.5 Защита роутов (Access Control)

```
Client                    Server                    Redis
  │                         │                         │
  ├─ GET /api/user/me ──────►                         │
  │   Cookie: sessionId     │                         │
  │                         ├─ AuthGuard:             │
  │                         │   extract sessionId     │
  │                         ├─ lookup session ────────►
  │                         ◄─── session data ────────┤
  │                         ├─ attach user to request │
  │                         ├─ proceed to controller  │
  │                         │                         │
  ◄─── 200 { user } ───────┤                         │
  │                         │                         │
  │  (если сессия невалидна)│                         │
  ◄─── 401 Unauthorized ───┤                         │
  │                         │                         │
  ├─ redirect to /login ────┤                         │
```

## 5. Модель данных (Prisma Schema)

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?                          // null для OAuth-only пользователей
  username      String    @unique
  isVerified    Boolean   @default(false)
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
}

model Account {
  id                String   @id @default(uuid())
  userId            String
  provider          String                       // "google", "credentials"
  providerAccountId String                       // ID у провайдера
  createdAt         DateTime @default(now())

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

### Сессии (Redis, не в БД)

```
key:   session:<sessionId>
value: {
  userId:    string
  ip:        string
  userAgent: string
  createdAt: number
}
TTL: 7 дней (конфигурируемо)
```

### Verification Codes (Redis)

```
key:   verify:<email>
value: <6-digit code>
TTL:   10 минут
```

## 6. Безопасность (OWASP Alignment)

| Угроза                      | Мера защиты                                                                |
| --------------------------- | -------------------------------------------------------------------------- |
| **Brute Force**             | Rate limiting на auth-эндпоинтах (throttler)                               |
| **Password Leak**           | Argon2id хэширование с уникальной солью                                    |
| **Session Hijacking**       | httpOnly + Secure + SameSite=Lax cookies; привязка сессии к IP/UA          |
| **XSS**                     | httpOnly cookies (токены недоступны из JS); Helmet headers                 |
| **CSRF**                    | SameSite=Lax; проверка Origin header                                       |
| **Injection**               | Prisma ORM (параметризованные запросы); class-validator на входе           |
| **Sensitive Data Exposure** | Переменные окружения через ConfigModule; маскирование логов                |
| **Broken Access Control**   | AuthGuard на всех защищённых роутах; проверка isVerified                   |
| **Session Fixation**        | Генерация нового sessionId при каждом логине                               |
| **Enumeration**             | Единообразные ответы на login/register (не раскрываем существование email) |

## 7. Структура серверных модулей

```
apps/server/src/
├── main.ts                            # Точка входа, bootstrap NestJS
├── common/                            # Общие утилиты (plain TS, без NestJS modules)
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() — извлечение пользователя из Request
│   │   └── public.decorator.ts        # @Public() — пометка публичных роутов
│   ├── guards/
│   │   ├── auth.guard.ts              # Глобальный guard: сессия → user на Request
│   │   └── verified.guard.ts          # Проверка isVerified (per-route)
│   ├── filters/
│   │   └── http-exception.filter.ts   # Глобальный exception filter
│   ├── interfaces/
│   │   └── session-user.interface.ts  # SessionUser — тип пользователя в сессии
│   ├── constants/
│   │   └── guard.messages.ts          # GuardMessage enum
│   ├── utils/
│   │   └── cookie.ts                  # Cookie name + options helper
│   └── express.d.ts                   # Express Request augmentation (user, sessionId)
└── modules/                           # NestJS модули, организованные по слоям
    ├── app.module.ts                  # Корневой модуль (импортирует агрегаторы)
    │
    ├── infrastructure/                # Инфраструктурный слой (транспорт, БД, кеш, конфиг)
    │   ├── infrastructure.module.ts   # Агрегатор: Database + Redis + Mail + Health + Logger + Throttler
    │   ├── config/
    │   │   ├── config.module.ts       # AppConfigModule — обёртка над ConfigModule.forRoot
    │   │   ├── env.ts                 # AppEnvs — класс валидации env-переменных
    │   │   ├── environment.enum.ts    # Environment enum (DEVELOPMENT, PRODUCTION, TEST)
    │   │   └── validate.ts            # Функция валидации через class-transformer
    │   ├── database/
    │   │   ├── database.module.ts     # @Global() DatabaseModule
    │   │   ├── database.service.ts    # DatabaseService (Prisma 7 + @prisma/adapter-pg)
    │   │   └── generated/prisma/      # Prisma 7 авто-генерация клиента
    │   ├── redis/
    │   │   ├── redis.module.ts        # @Global() RedisModule
    │   │   └── redis.service.ts       # RedisService (ioredis, композиция)
    │   ├── mail/
    │   │   ├── mail.module.ts         # @Global() MailModule
    │   │   └── mail.service.ts        # Транспорт email через SMTP (nodemailer)
    │   ├── health/
    │   │   ├── health.module.ts       # HealthModule
    │   │   └── health.controller.ts   # GET /api/health (live, ready, combined)
    │   ├── logger/
    │   │   └── logger.module.ts       # PinoLoggerModule конфигурация
    │   └── throttler/
    │       └── throttler.module.ts    # Rate-limiting конфигурация
    │
    ├── application/                   # Бизнес-логика (сервисы без контроллеров)
    │   ├── application.module.ts      # Агрегатор: Session + User + Notification + Auth
    │   ├── session/
    │   │   ├── session.module.ts      # @Global() SessionModule
    │   │   ├── session.service.ts     # CRUD сессий в Redis
    │   │   ├── session.types.ts       # SessionData, SessionInfo
    │   │   └── constants/
    │   │       └── session.constants.ts  # SessionConstants enum
    │   ├── user/
    │   │   ├── user.module.ts         # @Global() UserModule
    │   │   ├── user.service.ts        # CRUD пользователей, OAuth find-or-create (Prisma типы)
    │   │   └── user.types.ts          # SafeUser (Prisma-derived), OAuthProfile
    │   ├── notifications/
    │   │   ├── notification.module.ts    # NotificationModule
    │   │   ├── notification.service.ts   # Бизнес-логика уведомлений (использует MailService)
    │   │   └── templates/
    │   │       └── verification.ts       # HTML-шаблон кода верификации
    │   └── auth/
    │       ├── auth.module.ts         # AuthModule (Passport, providers)
    │       ├── auth.service.ts        # Register, login, verify, OAuth, change-password
    │       ├── constants/
    │       │   └── auth.constants.ts  # AuthConstants + AuthMessage enums
    │       ├── dto/
    │       │   ├── register.dto.ts
    │       │   ├── login.dto.ts
    │       │   ├── verify.dto.ts
    │       │   ├── resend-code.dto.ts
    │       │   └── change-password.dto.ts
    │       ├── strategies/
    │       │   └── google.strategy.ts  # Google OAuth Passport strategy
    │       └── guards/
    │           └── google-oauth.guard.ts  # Google OAuth guard
    │
    └── api/                           # HTTP-слой (контроллеры)
        ├── api.module.ts              # Агрегатор контроллеров
        └── auth/
            └── auth.controller.ts     # Все /api/auth/* эндпоинты
```

### Принципы архитектуры

- **infrastructure/** — транспорт, адаптеры, конфигурация. Не содержит бизнес-логики.
- **application/** — бизнес-логика. Зависит от infrastructure, не знает о HTTP.
- **api/** — HTTP-контроллеры. Тонкий слой, делегирует в application.
- **common/** — утилиты и cross-cutting concerns (guards, filters, decorators).
- Конфигурация: `ConfigService<AppEnvs, true>` из `@nestjs/config` с валидацией через class-validator.
- Типы данных: Prisma-generated типы (`User`, `Prisma.UserWhereInput`, `Prisma.UserCreateInput`) вместо кастомных.

## 8. Структура клиентских модулей (целевая)

```
apps/client/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx             # Главная (redirect если авторизован)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify/page.tsx
│   └── (protected)/
│       ├── layout.tsx       # AuthGuard на клиенте
│       └── dashboard/page.tsx
├── lib/
│   └── api-client.ts
├── providers/
│   ├── antd-provider.tsx
│   └── auth-provider.tsx    # React context для auth state
├── hooks/
│   └── use-auth.ts
├── components/
│   ├── auth/                # LoginForm, RegisterForm, VerifyForm
│   └── layout/              # Header, Sidebar
└── styles/
    └── globals.css
```

## 9. Переменные окружения

### Server (.env)

| Переменная             | Описание                     | Пример                                           |
| ---------------------- | ---------------------------- | ------------------------------------------------ |
| `NODE_ENV`             | Окружение                    | `development` / `production` / `test`            |
| `PORT`                 | Порт сервера                 | `4000`                                           |
| `LOG_LEVEL`            | Уровень логирования          | `debug` / `info` (опционально)                   |
| `CLIENT_URL`           | URL клиента (CORS)           | `http://localhost:3000`                          |
| `DATABASE_URL`         | PostgreSQL connection string | `postgresql://...`                               |
| `REDIS_HOST`           | Redis host                   | `localhost`                                      |
| `REDIS_PORT`           | Redis port                   | `6379`                                           |
| `SESSION_SECRET`       | Секрет для подписи cookie    | (random 64 chars)                                |
| `SESSION_TTL`          | Время жизни сессии (сек)     | `604800` (7 дней)                                |
| `GOOGLE_CLIENT_ID`     | OAuth Client ID              | (from Google Console)                            |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret          | (from Google Console)                            |
| `GOOGLE_CALLBACK_URL`  | OAuth callback               | `http://localhost:4000/api/auth/google/callback` |
| `MAIL_HOST`            | SMTP host                    | `smtp.gmail.com`                                 |
| `MAIL_PORT`            | SMTP port                    | `587`                                            |
| `MAIL_USER`            | SMTP user                    | (email)                                          |
| `MAIL_PASSWORD`        | SMTP password                | (app password)                                   |

### Client (.env)

| Переменная            | Описание    | Пример                  |
| --------------------- | ----------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | URL бэкенда | `http://localhost:4000` |
