import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer from 'nodemailer'
import type { AppEnvs } from '../config/env.js'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter | undefined
  private readonly fromAddress?: string

  constructor(config: ConfigService<AppEnvs, true>) {
    const host = config.get('MAIL_HOST', { infer: true })
    const port = config.get('MAIL_PORT', { infer: true })
    const user = config.get('MAIL_USER', { infer: true })
    const password = config.get('MAIL_PASSWORD', { infer: true })

    if (host && port && user && password) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass: password },
      })
      this.fromAddress = user
    } else {
      this.logger.warn('MAIL_* env variables not configured — emails will be logged to console')
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[DEV] Email to ${to}: ${subject}`)
      return
    }

    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, html })
      this.logger.log(`Email sent to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error)
    }
  }
}
