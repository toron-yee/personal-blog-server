import { Controller, Post, Body, Get, Patch, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { RedisCacheInterceptor } from '@/common/interceptors/cache.interceptor';
import { RateLimit } from '@/common/decorators/rate-limit.decorator';
import { RateLimitGuard } from '@/common/guards/rate-limit.guard';

@ApiTags('认证')
@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 发送邮箱验证码
   */
  @Public()
  @Post('send-code')
  @ApiOperation({ summary: '发送邮箱验证码' })
  @RateLimit({
    ttl: 60,
    limit: 1,
    keyPrefix: 'email_send',
    keyGenerator: (ctx) => {
      const request = ctx.switchToHttp().getRequest();
      return `email_send:${request.body.email}`;
    },
  })
  sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(dto);
  }

  /**
   * 用户注册
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * 用户登录
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * 刷新 Token
   */
  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @ApiOperation({ summary: '刷新Token' })
  refresh(@CurrentUser('id') userId: string, @Body() dto: RefreshTokenDto) {
    return this.authService.refresh(userId, dto.refreshToken);
  }

  /**
   * 验证邮箱（找回密码第一步）
   */
  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: '验证邮箱' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  /**
   * 重置密码（找回密码第二步）
   */
  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: '重置密码' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * 退出登录
   */
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录' })
  logout(@CurrentUser('id') userId: string, @Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(userId, token);
  }

  /**
   * 修改密码
   */
  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  updatePassword(@CurrentUser('id') userId: string, @Req() req: Request, @Body() dto: UpdatePasswordDto) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.updatePassword(userId, token, dto);
  }

  /**
   * 获取当前用户信息
   */
  @Get('profile')
  @ApiBearerAuth()
  @UseInterceptors(RedisCacheInterceptor)
  @Cacheable('profile', 300)
  @ApiOperation({ summary: '获取当前用户信息' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
