import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer from 'nodemailer'
import { getVerificationEmailHtml } from './templates/verification.js'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter | undefined

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST')
    const port = this.config.get<number>('MAIL_PORT')
    const user = this.config.get<string>('MAIL_USER')
    const pass = this.config.get<string>('MAIL_PASSWORD')

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })
    } else {
      this.logger.warn('MAIL_* env variables not configured — emails will be logged to console')
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const subject = `Your verification code: ${code}`
    const html = getVerificationEmailHtml(code)

    if (!this.transporter) {
      this.logger.log(`[DEV] Verification code for ${to}: ${code}`)
      return
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('MAIL_USER'),
        to,
        subject,
        html,
      })
      this.logger.log(`Verification email sent to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error)
    }
  }
}
