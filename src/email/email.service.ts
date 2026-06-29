import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendMailOptions, Transporter } from 'nodemailer';

type SendEmailBase = {
  to: string | string[];
  subject: string;
};

type SendEmailParams =
  | (SendEmailBase & {
      text: string;
      html?: never;
    })
  | (SendEmailBase & {
      html: string;
      text?: never;
    });

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.getRequiredEnvVariable('SMTP_HOST');
    const user = this.getRequiredEnvVariable('SMTP_USER');
    const pass = this.getRequiredEnvVariable('SMTP_PASS');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const fromName = this.configService.get<string>('MAIL_FROM_NAME');
    const fromAddress = this.configService.get<string>('SMTP_USER');

    this.defaultFrom = `${fromName} <${fromAddress}>`;
    this.transporter = nodemailer.createTransport({
      host,
      secure,
      auth: { user, pass },
      port,
    });
  }
  async onModuleInit() {
    try {
      this.logger.log('EmailService initialized');
    } catch (error) {
      this.logger.error('SMTP verification failed', error);
    }
  }
  async sendEmail(params: SendEmailParams) {
    const EmailOptions: SendMailOptions = {
      from: this.defaultFrom,
      to: params.to,
      subject: params.subject,
      ...(params.text !== undefined
        ? { text: params.text }
        : { html: params.html }),
    };
    try {
      const info = await this.transporter.sendMail(EmailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const resetUrl = `${frontendUrl.replace(
      /\/$/,
      '',
    )}/reset-password?token=${encodeURIComponent(resetToken)}`;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset.</p><p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
    });
  }

  async sendNewLoginEmail(email: string, full_name: string) {
    return this.sendEmail({
      to: email,
      subject: 'New Login Detected',
      text: `Hello ${full_name},\n\nWe detected a new login to your account.`,
    });
  }

  private getRequiredEnvVariable(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Environment variable not found: ${key}`);
    }
    return value;
  }
}
