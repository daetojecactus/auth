import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Logger } from 'nestjs-pino'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './modules/app.module.js'
import type { AppEnvs } from './modules/infrastructure/config/env.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  const config = app.get<ConfigService<AppEnvs, true>>(ConfigService)

  app.useLogger(app.get(Logger))

  app.use(helmet())
  app.use(cookieParser(config.get('SESSION_SECRET')))

  app.setGlobalPrefix('api')
  app.enableCors({
    origin: config.get('CLIENT_URL'),
    credentials: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.enableShutdownHooks()

  const port = config.get('PORT')
  await app.listen(port)

  const logger = app.get(Logger)
  logger.log(`Server running on http://localhost:${port}`, 'Bootstrap')
}

bootstrap()
