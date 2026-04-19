import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './modules/app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const config = app.get(ConfigService)

  // 8.2 — Use Pino structured logger globally
  app.useLogger(app.get(Logger))

  app.use(helmet())
  app.use(cookieParser(config.get<string>('SESSION_SECRET')))

  app.setGlobalPrefix('api')
  app.enableCors({
    origin: config.get<string>('CLIENT_URL', 'http://localhost:3000'),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // 8.3 — Graceful shutdown: Prisma & Redis disconnect via lifecycle hooks
  app.enableShutdownHooks()

  const port = config.get<number>('PORT', 4000)
  await app.listen(port)

  const logger = app.get(Logger)
  logger.log(`Server running on http://localhost:${port}`, 'Bootstrap')
}

bootstrap()
