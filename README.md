# Auth Service

Промышленный сервис аутентификации: регистрация, email-верификация, сессии на Redis, Google OAuth 2.0.

## Стек

| Слой | Технология |
|------|-----------|
| Backend | NestJS 11, TypeScript 6, Node.js 24 (ESM) |
| Frontend | Next.js 16, React 19, Ant Design 6 |
| Database | PostgreSQL 17, Prisma 7 |
| Cache / Sessions | Redis 7 (ioredis) |
| Монорепо | pnpm 10 workspaces |

## Быстрый старт

### Первый запуск (настройка)

```bash
# 1. Установить зависимости
pnpm install

# 2. Поднять PostgreSQL и Redis
pnpm docker:up

# 3. Настроить окружение
cp apps/server/.env.example apps/server/.env
# Заполнить SESSION_SECRET (минимум 32 символа)

# 4. Применить миграции и сгенерировать Prisma client
pnpm prisma:migrate
pnpm prisma:generate
```

### Запуск (server + client одной командой)

```bash
# Поднять контейнеры БД и запустить оба приложения
pnpm docker:up && pnpm dev
```

После этого:
- **Server** — `http://localhost:4000` (API + health check)
- **Client** — `http://localhost:3000` (фронтенд)

Проверка: `curl http://localhost:4000/api/health` должен вернуть `{"status":"ok","database":"connected","redis":"connected"}`.

### Запуск по отдельности

```bash
pnpm dev:server   # только сервер (:4000)
pnpm dev:client   # только клиент (:3000)
```

## API эндпоинты

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| `GET` | `/api/health` | Статус сервиса, БД, Redis | — |
| `POST` | `/api/auth/register` | Регистрация (email + password) | — |
| `POST` | `/api/auth/login` | Вход (создание сессии, Set-Cookie) | — |
| `POST` | `/api/auth/verify` | Подтверждение email (6-значный код) | — |
| `POST` | `/api/auth/resend-code` | Повторная отправка кода верификации | — |
| `GET` | `/api/auth/google` | OAuth redirect на Google | — |
| `GET` | `/api/auth/google/callback` | OAuth callback | — |
| `GET` | `/api/auth/session` | Текущий пользователь | 🔒 |
| `GET` | `/api/auth/sessions` | Список активных сессий | 🔒 |
| `DELETE` | `/api/auth/sessions/:id` | Отзыв конкретной сессии | 🔒 |
| `POST` | `/api/auth/change-password` | Смена пароля | 🔒 |
| `POST` | `/api/auth/logout` | Выход (удаление сессии) | 🔒 |

Аутентификация через httpOnly cookie (`session_id`). Эндпоинты с 🔒 требуют наличия валидной сессии.

## Переменные окружения (server)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `NODE_ENV` | Окружение | `development` |
| `PORT` | Порт сервера | `4000` |
| `LOG_LEVEL` | Уровень логов | `debug` / `info` |
| `CLIENT_URL` | URL клиента (CORS) | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/auth_db` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `SESSION_SECRET` | Секрет подписи cookie | (random 64 chars) |
| `SESSION_TTL` | TTL сессии (сек) | `604800` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | — |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | — |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:4000/api/auth/google/callback` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP user | — |
| `MAIL_PASSWORD` | SMTP password | — |

## Архитектура сервера

```
src/
├── main.ts                              # Bootstrap
├── common/                              # Plain TS (guards, filters, decorators)
│   ├── constants/                       # Enum-константы guard-сообщений
│   ├── decorators/                      # @CurrentUser(), @Public()
│   ├── filters/                         # HttpExceptionFilter
│   ├── guards/                          # AuthGuard, VerifiedGuard
│   └── utils/                           # Cookie helpers
└── modules/                             # NestJS модули по слоям
    ├── infrastructure/                  # Инфраструктура (транспорт, БД, кеш, конфиг)
    │   ├── config/                      # ConfigModule + env validation (AppEnvs)
    │   ├── database/                    # Prisma 7 + @prisma/adapter-pg
    │   ├── redis/                       # ioredis (композиция)
    │   ├── mail/                        # SMTP транспорт (nodemailer)
    │   ├── health/                      # /api/health (DB + Redis check)
    │   ├── logger/                      # Pino logger (structured, redacted)
    │   └── throttler/                   # Rate limiting (3 tiers)
    ├── application/                     # Бизнес-логика
    │   ├── auth/                        # Register, login, verify, OAuth
    │   ├── session/                     # Redis sessions CRUD
    │   ├── user/                        # User CRUD, find-or-create (Prisma типы)
    │   └── notifications/               # Уведомления (шаблоны + отправка через MailService)
    └── api/                             # HTTP контроллеры
        └── auth/                        # /api/auth/* endpoints
```

### Принципы

- **infrastructure/** — адаптеры к внешним системам, конфигурация. Без бизнес-логики.
- **application/** — бизнес-правила. Зависит от infrastructure, не знает о HTTP.
- **api/** — тонкий HTTP-слой, делегирует в application.
- Конфигурация: `ConfigService<AppEnvs, true>` — строго типизирован, валидирован через class-validator.
- Типы данных: Prisma-generated типы вместо кастомных (`Prisma.UserWhereInput`, `Prisma.UserCreateInput`).

## Docker

```bash
# Build
docker build -f apps/server/Dockerfile -t auth-server .

# Run
docker run -p 4000:4000 --env-file apps/server/.env auth-server
```

## Скрипты

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Запуск server + client (parallel) |
| `pnpm dev:server` | Запуск только сервера |
| `pnpm build` | Сборка всех приложений |
| `pnpm prisma:generate` | Генерация Prisma client |
| `pnpm prisma:migrate` | Применение миграций |
| `pnpm docker:up` | Запуск PostgreSQL + Redis |
| `pnpm docker:down` | Остановка контейнеров |