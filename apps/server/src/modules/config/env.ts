import { IsString, IsNumber, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'

export class AppEnvs {
  @IsString()
  NODE_ENV!: string

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT!: number

  @IsString()
  CLIENT_URL!: string

  @IsString()
  DATABASE_URL!: string

  @IsString()
  REDIS_HOST!: string

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT!: number

  @IsString()
  SESSION_SECRET!: string

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  SESSION_TTL!: number

  @IsString()
  @IsOptional()
  LOG_LEVEL?: string

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string

  @IsString()
  @IsOptional()
  MAIL_HOST?: string

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  MAIL_PORT?: number

  @IsString()
  @IsOptional()
  MAIL_USER?: string

  @IsString()
  @IsOptional()
  MAIL_PASSWORD?: string
}
