import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [
    {
      provide: 'EMAIL_TRANSPORTER',
      useFactory: (configService: ConfigService) => {
        return nodemailer.createTransport({
          service: configService.get('EMAIL_SERVICE', 'qq'),
          host: configService.get('EMAIL_HOST', 'smtp.qq.com'),
          port: +configService.get('EMAIL_PORT', '465'),
          secure: true,
          auth: {
            user: configService.get('EMAIL_USER'),
            pass: configService.get('EMAIL_PASS'),
          },
        });
      },
      inject: [ConfigService],
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
