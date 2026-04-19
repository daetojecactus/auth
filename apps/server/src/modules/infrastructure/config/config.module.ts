import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validate } from './validate.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
  ],
})
export class AppConfigModule {}
