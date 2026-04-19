import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { AppEnvs } from './env.js'

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(AppEnvs, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  })

  if (errors.length > 0) {
    const messages = errors.map((err) => Object.values(err.constraints || {}).join(', ')).join('\n')
    throw new Error(`Environment validation failed:\n${messages}`)
  }

  return validated
}
