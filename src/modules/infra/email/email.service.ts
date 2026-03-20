import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sanitizeHtml from 'sanitize-html';
import { Response } from '@/common/utils/response';
import { AppLoggerService } from '@/modules/infra/logging/logging.service';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_TRANSPORTER') private transporter: nodemailer.Transporter,
    private configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async sendEmail(sendEmailDto: SendEmailDto) {
    const { toEmail, subject, htmlInfo } = sendEmailDto;
    const startedAt = Date.now();
    const maskedEmail = this.maskEmail(toEmail);

    this.logger.log('Email sending started', EmailService.name, {
      toEmail: maskedEmail,
      subject,
    });

    try {
      const sanitizedHtml = sanitizeHtml(htmlInfo, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'width', 'height'],
          a: ['href', 'target'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
      });

      const mailOptions = {
        from: this.configService.get('EMAIL_FROM'),
        to: toEmail,
        subject,
        html: sanitizedHtml,
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log('Email sending completed', EmailService.name, {
        toEmail: maskedEmail,
        subject,
        durationMs: Date.now() - startedAt,
      });

      return new Response('邮件发送成功');
    } catch (error) {
      this.logger.error(
        'Email sending failed',
        EmailService.name,
        error instanceof Error ? error.stack : undefined,
        {
          toEmail: maskedEmail,
          subject,
          durationMs: Date.now() - startedAt,
        },
      );
      throw new BadRequestException('邮件发送失败，请稍后重试');
    }
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return '***';
    const maskedLocal = localPart.length > 1 ? localPart[0] + '***' : '***';
    return `${maskedLocal}@${domain}`;
  }
}
