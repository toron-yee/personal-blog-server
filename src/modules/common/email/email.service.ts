import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';
import { Response } from '@/common/utils/response';

@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_TRANSPORTER') private transporter: nodemailer.Transporter,
    private configService: ConfigService,
  ) {}

  async sendEmail(sendEmailDto: SendEmailDto) {
    const { toEmail, subject, htmlInfo } = sendEmailDto;

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to: toEmail,
      subject,
      html: htmlInfo,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`邮件发送成功: ${toEmail}，时间: ${new Date().toLocaleString('zh-CN')}`);

    return new Response('邮件发送成功');
  }
}
