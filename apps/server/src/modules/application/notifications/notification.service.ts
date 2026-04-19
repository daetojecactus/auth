import { Injectable } from '@nestjs/common'
import { MailService } from '../../infrastructure/mail/mail.service.js'
import { getVerificationEmailHtml } from './templates/verification.js'

@Injectable()
export class NotificationService {
  constructor(private readonly mail: MailService) {}

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const subject = `Your verification code: ${code}`
    const html = getVerificationEmailHtml(code)
    await this.mail.send(to, subject, html)
  }
}
