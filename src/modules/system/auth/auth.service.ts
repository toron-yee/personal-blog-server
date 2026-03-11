import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '@/modules/system/user/entities/user.entity';
import { RedisService } from '@/modules/common/redis/redis.service';
import { EmailService } from '@/modules/common/email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Response } from '@/common/utils/response';

const REFRESH_TOKEN_PREFIX = 'auth:refresh:';
const BLACKLIST_PREFIX = 'auth:blacklist:';
const VERIFICATION_CODE_PREFIX = 'auth:verify:';
const RESET_PASSWORD_PREFIX = 'auth:reset:';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      // 验证邮箱验证码
      const storedCode = await this.redisService.get(
        `${VERIFICATION_CODE_PREFIX}${dto.email}`,
      );
      if (!storedCode || storedCode !== dto.code) {
        throw new BadRequestException('验证码错误或已过期');
      }

      const existByEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existByEmail) throw new BadRequestException('该邮箱已被注册');

      const existByUsername = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (existByUsername) throw new BadRequestException('该用户名已被占用');

      const { code, ...userData } = dto;
      const user = this.userRepo.create(userData);
      await this.userRepo.save(user);

      // 删除验证码
      await this.redisService.del(`${VERIFICATION_CODE_PREFIX}${dto.email}`);
      await this.redisService.delByPrefix('cache:user-list:');

      const tokens = await this.generateAndStoreTokens(user);
      return new Response('注册成功', {
        ...tokens,
        user: this.sanitizeUser(user),
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('邮箱或密码错误');

    const isPasswordValid = bcrypt.compareSync(dto.password, user.password);
    if (!isPasswordValid) throw new BadRequestException('邮箱或密码错误');

    const tokens = await this.generateAndStoreTokens(user);
    return new Response('登录成功', {
      ...tokens,
      user: this.sanitizeUser(user),
    });
  }

  async refresh(userId: string, refreshToken: string) {
    const stored = await this.redisService.get(
      `${REFRESH_TOKEN_PREFIX}${userId}`,
    );
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const tokens = await this.generateAndStoreTokens(user);
    return new Response('刷新成功', tokens);
  }

  async logout(userId: string, accessToken: string) {
    await this.redisService.del(`${REFRESH_TOKEN_PREFIX}${userId}`);

    const decoded = this.jwtService.decode(accessToken) as { exp?: number };
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(
          `${BLACKLIST_PREFIX}${accessToken}`,
          '1',
          ttl,
        );
      }
    }

    return new Response('退出登录成功');
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    return this.redisService.exists(`${BLACKLIST_PREFIX}${token}`);
  }

  async updatePassword(
    userId: string,
    accessToken: string,
    dto: UpdatePasswordDto,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isOldValid = bcrypt.compareSync(dto.oldPassword, user.password);
    if (!isOldValid) throw new BadRequestException('旧密码错误');

    user.password = bcrypt.hashSync(dto.newPassword, 10);
    await this.userRepo.save(user);

    await this.redisService.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken) as { exp?: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(
            `${BLACKLIST_PREFIX}${accessToken}`,
            '1',
            ttl,
          );
        }
      }
    }

    const tokens = await this.generateAndStoreTokens(user);
    return new Response('密码修改成功，请使用新Token', tokens);
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return new Response('获取成功', this.sanitizeUser(user));
  }

  private async generateAndStoreTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '30m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const refreshTtl = this.parseTtlToSeconds(
      this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
    await this.redisService.set(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      refreshToken,
      refreshTtl,
    );

    return { accessToken, refreshToken };
  }

  private parseTtlToSeconds(ttl: string): number {
    const match = ttl.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 7 * 24 * 3600;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(dto: SendVerificationCodeDto) {
    const code = Math.random().toString().slice(2, 8);

    // 存储验证码到 Redis，有效期 10 分钟
    await this.redisService.set(
      `${VERIFICATION_CODE_PREFIX}${dto.email}`,
      code,
      600,
    );

    // 发送邮件
    await this.emailService.sendEmail({
      toEmail: dto.email,
      subject: '邮箱验证码',
      htmlInfo: `您的邮箱验证码是：${code}，有效期为10分钟。`,
    });

    return new Response('验证码已发送，请查收邮件');
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const storedCode = await this.redisService.get(
      `${VERIFICATION_CODE_PREFIX}${dto.email}`,
    );
    if (!storedCode || storedCode !== dto.code) {
      throw new BadRequestException('验证码错误或已过期');
    }

    // 删除验证码
    await this.redisService.del(`${VERIFICATION_CODE_PREFIX}${dto.email}`);

    // 生成重置密码令牌，有效期 30 分钟
    const resetToken = Math.random().toString(36).slice(2);
    await this.redisService.set(
      `${RESET_PASSWORD_PREFIX}${dto.email}`,
      resetToken,
      1800,
    );

    return new Response('邮箱验证成功', { resetToken });
  }

  /**
   * 重置密码
   */
  async resetPassword(dto: ResetPasswordDto) {
    const storedCode = await this.redisService.get(
      `${VERIFICATION_CODE_PREFIX}${dto.email}`,
    );
    if (!storedCode || storedCode !== dto.code) {
      throw new BadRequestException('验证码错误或已过期');
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('用户不存在');

    user.password = bcrypt.hashSync(dto.newPassword, 10);
    await this.userRepo.save(user);

    // 删除验证码和重置令牌
    await this.redisService.del(`${VERIFICATION_CODE_PREFIX}${dto.email}`);
    await this.redisService.del(`${RESET_PASSWORD_PREFIX}${dto.email}`);

    // 清除该用户的所有 Token
    await this.redisService.del(`${REFRESH_TOKEN_PREFIX}${user.id}`);

    return new Response('密码重置成功，请使用新密码登录');
  }
}
