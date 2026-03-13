import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as sanitizeHtml from 'sanitize-html';
import { SendEmailDto } from './dto/send-email.dto';
import { Response } from '@/common/utils/response';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject('EMAIL_TRANSPORTER') private transporter: nodemailer.Transporter,
    private configService: ConfigService,
  ) {}

  async sendEmail(sendEmailDto: SendEmailDto) {
    const { toEmail, subject, htmlInfo } = sendEmailDto;

    try {
      // HTML 内容净化，防止注入攻击
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

      // 脱敏日志：只显示邮箱域名
      const maskedEmail = this.maskEmail(toEmail);
      this.logger.log(`邮件发送成功: ${maskedEmail}，时间: ${new Date().toLocaleString('zh-CN')}`);

      return new Response('邮件发送成功');
    } catch (error) {
      this.logger.error(`邮件发送失败: ${this.maskEmail(toEmail)}`, error.stack);
      throw new BadRequestException('邮件发送失败，请稍后重试');
    }
  }

  /**
   * 邮箱脱敏处理
   * 例如: user@example.com -> u***@example.com
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return '***';
    const maskedLocal = localPart.length > 1
      ? localPart[0] + '***'
      : '***';
    return `${maskedLocal}@${domain}`;
  }
}
