import { Module } from '@nestjs/common'
import { ApplicationModule } from '../application/application.module.js'
import { AuthController } from './auth/auth.controller.js'

@Module({
  imports: [ApplicationModule],
  controllers: [AuthController],
})
export class ApiModule {}
