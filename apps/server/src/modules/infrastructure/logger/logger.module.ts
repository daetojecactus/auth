import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import type { IncomingMessage } from 'http'
import { Environment } from '../config/environment.enum.js'
import type { AppEnvs } from '../config/env.js'

const SENSITIVE_PATHS = [
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'secret',
  'cookie',
  'authorization',
]

function redactOptions() {
  return {
    paths: SENSITIVE_PATHS.map((p) => `req.body.${p}`)
      .concat(SENSITIVE_PATHS.map((p) => `req.headers.${p}`))
      .concat(['req.headers.cookie', 'req.headers.authorization']),
    censor: '[REDACTED]',
  }
}

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnvs, true>) => {
        const isProd = config.get('NODE_ENV') === Environment.PRODUCTION
        return {
          pinoHttp: {
            redact: redactOptions(),
            transport: !isProd
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
            level: !isProd ? 'debug' : 'info',
            serializers: {
              req(req: IncomingMessage & { id?: string; remoteAddress?: string }) {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  remoteAddress: req.remoteAddress,
                }
              },
              res(res: { statusCode: number }) {
                return { statusCode: res.statusCode }
              },
            },
            autoLogging: {
              ignore: (req: IncomingMessage) => req.url === '/api/health',
            },
          },
        }
      },
    }),
  ],
})
export class LoggerModule {}
