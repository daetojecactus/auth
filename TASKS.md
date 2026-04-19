# Auth Service — Задачи проекта

> Статусы: `[ ]` TODO · `[>]` IN_PROGRESS · `[x]` DONE

---

## Этап 1: Документация и архитектура

- [x] 1.1. Инициализация монорепо (pnpm workspaces, root scripts)
- [x] 1.2. Базовая структура сервера (NestJS, Prisma, Redis, Health endpoint)
- [x] 1.3. Базовая структура клиента (Next.js, Ant Design, API client)
- [x] 1.4. Docker Compose (PostgreSQL 17, Redis 7)
- [x] 1.5. Первичная миграция Prisma (модель User)
- [x] 1.6. Конфиг prettier, .gitignore, .nvmrc
- [x] 1.7. Создать CONTEXT.md (архитектура, flows, модель данных, безопасность)
- [x] 1.8. Создать TASKS.md (полный план задач по этапам)

---

## Этап 2: Серверное ядро — конфигурация, безопасность, сессии

- [x] 2.1. Типизированная конфигурация (ConfigModule, app.config.ts с валидацией env)
- [x] 2.2. Расширить Prisma-схему (username, isVerified, avatarUrl, Account для OAuth)
- [x] 2.3. Миграция БД под новую схему
- [x] 2.4. Модуль сессий (SessionService: create, get, delete, rotate в Redis)
- [x] 2.5. Cookie-менеджмент (httpOnly, Secure, SameSite=Lax, подпись)
- [x] 2.6. AuthGuard (проверка сессии через Redis, attach user к request)
- [x] 2.7. Декораторы @CurrentUser(), @Public()
- [x] 2.8. HttpExceptionFilter (единый формат ошибок, маскирование деталей)
- [x] 2.9. Helmet middleware (security headers)
- [x] 2.10. Rate Limiting (throttler на auth-эндпоинтах)

---

## Этап 3: Регистрация и логин (Email + Password)

- [x] 3.1. UserModule + UserService (CRUD, поиск по email)
- [x] 3.2. AuthModule + AuthService (register, login, logout)
- [x] 3.3. RegisterDto, LoginDto (class-validator, whitelist)
- [x] 3.4. Хэширование паролей (Argon2id)
- [x] 3.5. POST /api/auth/register (создание пользователя, отправка кода)
- [x] 3.6. POST /api/auth/login (проверка пароля, создание сессии, Set-Cookie)
- [x] 3.7. POST /api/auth/logout (удаление сессии, очистка cookie)
- [x] 3.8. GET /api/auth/session (текущий пользователь по cookie)
- [x] 3.9. Защита от user enumeration (единообразные ответы)

---

## Этап 4: Email Verification

- [x] 4.1. MailModule + MailService (SMTP через nodemailer)
- [x] 4.2. Генерация 6-значного кода, сохранение в Redis с TTL 10 мин
- [x] 4.3. POST /api/auth/verify (проверка кода, isVerified = true)
- [x] 4.4. POST /api/auth/resend-code (повторная отправка с rate limit)
- [x] 4.5. VerifiedGuard (доступ только для подтверждённых пользователей)
- [x] 4.6. HTML-шаблон письма с кодом

---

## Этап 5: OAuth 2.0 (Google)

- [x] 5.1. Passport.js + @nestjs/passport (Google Strategy)
- [x] 5.2. GET /api/auth/google (redirect на Google consent)
- [x] 5.3. GET /api/auth/google/callback (обмен code → tokens → profile)
- [x] 5.4. Логика find-or-create User + Account
- [x] 5.5. Линковка Google-аккаунта с существующим email
- [x] 5.6. Redirect на клиент после OAuth с установкой cookie
- [x] 5.7. Обновить CONTEXT.md и TASKS.md по завершению

---

## Этап 6: Клиент — страницы авторизации

- [x] 6.1. AuthProvider (React context, проверка сессии при загрузке)
- [x] 6.2. useAuth хук (login, register, logout, user state)
- [x] 6.3. Страница /login (форма, валидация, кнопка Google)
- [x] 6.4. Страница /register (форма, валидация)
- [x] 6.5. Страница /verify (ввод 6-значного кода, resend)
- [x] 6.6. Protected layout (redirect на /login если нет сессии)
- [x] 6.7. Страница /dashboard (заглушка для авторизованных)
- [x] 6.8. Header компонент (user info, logout)

---

## Этап 7: Управление сессиями (Advanced)

- [x] 7.1. Ротация sessionId при каждом логине (anti-fixation)
- [x] 7.2. Привязка сессии к IP + User-Agent
- [x] 7.3. GET /api/auth/sessions (список активных сессий пользователя)
- [x] 7.4. DELETE /api/auth/sessions/:id (отзыв конкретной сессии)
- [x] 7.5. Автоматическая инвалидация при смене пароля
- [x] 7.6. Sliding expiration (продление TTL при активности)

---

## Этап 8: Hardening и production-readiness

- [x] 8.1. Маскирование чувствительных данных в логах (password, tokens)
- [x] 8.2. Structured logging (pino / winston)
- [x] 8.3. Graceful shutdown (Prisma disconnect, Redis quit)
- [x] 8.4. Health check расширенный (readiness + liveness)
- [x] 8.5. Dockerfile для server и client (multi-stage build)
- [x] 8.6. docker-compose.prod.yml
- [x] 8.7. CI lint + build проверка
- [x] 8.8. Обновить все зависимости до стабильных и новых версий, особенно pnpm и node

---

## Этап 9: Обновление завсимостей

- [x] 9.1. Необходимо поднять все версии пакетов до актуальных
- [x] 9.2. Поднять все версии pnpm, node (24), prisma, nest и все остальные
- [x] 9.3. Пересобрать все конфиг файлы и зависимости под актуальные версии
- [x] 9.4. Установить все завсимости
- [x] 9.5. Убедится, что приложение корректно запускается, нет ошибок, что все методы API работают


---

## Этап 10: Рефакторинг

- [x] 10.1. Починить билд проекта (ошибки `Cannot find module '@nestjs/config'`, `crypto` и др.)
- [x] 10.2. Проверить необходимость указания `.js` в import-путях (привести к единому стандарту)
- [x] 10.3. Добавить и актуализировать `.env` переменные (NODE_ENV, LOG_LEVEL и др.)
- [x] 10.4. Пересобрать архитектуру модулей (выделить технические модули: db, redis, health и т.д.)
- [x] 10.5. Централизовать работу с БД в отдельном модуле
- [x] 10.6. Упростить `AppModule` (подключать только агрегированные модули)
- [x] 10.7. Привести архитектуру к слоям: `api / application`
- [x] 10.8. Использовать референс-подход из проекта `/home/danil/projects/report-daily-bot` (архитектура слоев, тех. модули, организация кода)
- [x] 10.9. Удалить неиспользуемые файлы и код
- [x] 10.10. Вынести тексты, типы, интерфейсы, enums в отдельные директории (по аналогии с `/home/danil/projects/report-daily-bot`)
- [x] 10.11. Проверить необходимость `.nvmrc` (и удалить при отсутствии смысла при использовании pnpm)
- [x] 10.12. Проверить и привести в порядок конфиги (`package.json`, зависимости и т.д.)
- [x] 10.13. Полностью переустановить зависимости (`node_modules`, `pnpm-lock.yaml`)
- [x] 10.14. Оптимизировать Docker-файлы
- [x] 10.15. Проверить полный цикл: билд → запуск → работоспособность
- [x] 10.16. Обновить `README.md` (инструкции по запуску, описание API)
- [x] 10.17. Обновить файлы `tasks` и `context`

---

## Этап 11: Стабилизация и инфраструктура

- [x] 11.1. Починить ошибки сборки (`@nestjs/config`, `crypto`, `nestjs-pino` и др.) и выяснить первопричину
- [x] 11.2. Вынести `ThrottlerModule` в отдельный модуль
- [x] 11.3. Вынести `LoggerModule` (nestjs-pino) в отдельный модуль
- [x] 11.4. Подключать инфраструктурные модули отдельно через `AppModule`
- [x] 11.5. Вынести все текстовые сообщения в константы
- [x] 11.6. Создать папку `constants` (например `auth.messages.ts`)
- [x] 11.7. Описать сообщения через `enum` (например: `Logged out successfully` и др.)
- [x] 11.8. Провести строгую типизацию проекта (убрать `any`)
- [x] 11.9. Исправить ошибки типов (например `Property 'socket' does not exist on type Request`)
- [x] 11.10. Проверить и привести в порядок конфиги (`package.json`, зависимости и т.д.)
- [x] 11.11. Полностью переустановить зависимости (`node_modules`, `pnpm-lock.yaml`)
- [x] 11.12. Выполнить запуск приложения и проверить работоспособность
- [x] 11.13. Протестировать основные эндпоинты (тестовые запросы)
- [x] 11.14. Оптимизировать `Dockerfile`
- [x] 11.15. Добавить и актуализировать `.env` переменные (NODE_ENV, LOG_LEVEL и др.)
- [x] 11.16. Обновить `README.md` (инструкции по запуску, описание API)

---

## Этап 12: Тестирование

> **← Следующий этап**

- [ ] 12.1. Unit-тесты AuthService (register, login, verify)
- [ ] 12.2. Unit-тесты SessionService
- [ ] 12.3. E2E тесты auth flow (supertest)
- [ ] 12.4. Тестовая БД (docker test container или in-memory)
- [ ] 12.5. Coverage отчёт (>80%)
