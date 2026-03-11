import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user.enum';

@ApiTags('邮件服务')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @ApiOperation({ summary: '发送邮件（管理员）' })
  @Roles(UserRole.ADMIN)
  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return await this.emailService.sendEmail(sendEmailDto);
  }
}
