import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Response } from '@/common/utils/response';
import { User } from '@/modules/identity/user/entities/user.entity';
import { EmailService } from '@/modules/infra/email/email.service';
import { AppLoggerService } from '@/modules/infra/logging/logging.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

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
    private readonly emailService: EmailService,
    private readonly logger: AppLoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async register(dto: RegisterDto) {
    const startedAt = Date.now();
    const maskedEmail = this.maskEmail(dto.email);

    try {
      const storedCode = await this.cacheManager.get<string>(
        `${VERIFICATION_CODE_PREFIX}${dto.email}`,
      );
      if (!storedCode || storedCode !== dto.code) {
        this.logger.warn('Registration rejected because verification code was invalid', AuthService.name, {
          email: maskedEmail,
          username: dto.username,
        });
        throw new BadRequestException('验证码错误或已过期');
      }

      const existByEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existByEmail) {
        this.logger.warn('Registration rejected because email already existed', AuthService.name, {
          email: maskedEmail,
          username: dto.username,
        });
        throw new BadRequestException('该邮箱已被注册');
      }

      const existByUsername = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (existByUsername) {
        this.logger.warn('Registration rejected because username already existed', AuthService.name, {
          email: maskedEmail,
          username: dto.username,
        });
        throw new BadRequestException('该用户名已被占用');
      }

      const { code, ...userData } = dto;
      const user = this.userRepo.create(userData);
      await this.userRepo.save(user);
      await this.cacheManager.del(`${VERIFICATION_CODE_PREFIX}${dto.email}`);

      const tokens = await this.generateAndStoreTokens(user);

      this.logger.log('User registered', AuthService.name, {
        userId: user.id,
        email: maskedEmail,
        username: user.username,
        durationMs: Date.now() - startedAt,
      });

      return new Response('注册成功', {
        ...tokens,
        user: this.sanitizeUser(user),
      });
    } catch (error) {
      this.logger.error(
        'User registration failed',
        AuthService.name,
        error instanceof Error ? error.stack : undefined,
        {
          email: maskedEmail,
          username: dto.username,
          durationMs: Date.now() - startedAt,
        },
      );
      throw new BadRequestException(error instanceof Error ? error.message : '注册失败');
    }
  }

  async login(dto: LoginDto) {
    const startedAt = Date.now();
    const email = dto.email?.trim();
    const username = dto.username?.trim();
    const identifier = email ? this.maskEmail(email) : username || 'unknown';

    if (!email && !username) {
      this.logger.warn('Login rejected because identifier was missing', AuthService.name);
      throw new BadRequestException('邮箱或用户名不能为空');
    }

    const user = await this.userRepo.findOne({
      where: email ? { email } : { username },
    });
    if (!user) {
      this.logger.warn('Login rejected because user was not found', AuthService.name, {
        identifier,
      });
      throw new BadRequestException('邮箱、用户名或密码错误');
    }

    const isPasswordValid = bcrypt.compareSync(dto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn('Login rejected because password was invalid', AuthService.name, {
        userId: user.id,
        identifier,
      });
      throw new BadRequestException('邮箱、用户名或密码错误');
    }

    const tokens = await this.generateAndStoreTokens(user);

    this.logger.log('User logged in', AuthService.name, {
      userId: user.id,
      identifier,
      durationMs: Date.now() - startedAt,
    });

    return new Response('登录成功', {
      ...tokens,
      user: this.sanitizeUser(user),
    });
  }

  async refresh(userId: string, refreshToken: string) {
    const startedAt = Date.now();
    const stored = await this.cacheManager.get<string>(
      `${REFRESH_TOKEN_PREFIX}${userId}`,
    );
    if (!stored || stored !== refreshToken) {
      this.logger.warn('Token refresh rejected because refresh token was invalid', AuthService.name, {
        userId,
      });
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn('Token refresh rejected because user was not found', AuthService.name, {
        userId,
      });
      throw new UnauthorizedException('用户不存在');
    }

    const tokens = await this.generateAndStoreTokens(user);

    this.logger.log('Token refreshed', AuthService.name, {
      userId,
      durationMs: Date.now() - startedAt,
    });

    return new Response('刷新成功', tokens);
  }

  async logout(userId: string, accessToken: string) {
    const startedAt = Date.now();
    await this.cacheManager.del(`${REFRESH_TOKEN_PREFIX}${userId}`);

    const decoded = this.jwtService.decode(accessToken) as { exp?: number };
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.cacheManager.set(
          `${BLACKLIST_PREFIX}${accessToken}`,
          '1',
          ttl * 1000,
        );
      }
    }

    this.logger.log('User logged out', AuthService.name, {
      userId,
      durationMs: Date.now() - startedAt,
    });

    return new Response('退出登录成功');
  }

  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(`${BLACKLIST_PREFIX}${token}`);
    return !!result;
  }

  async updatePassword(
    userId: string,
    accessToken: string,
    dto: UpdatePasswordDto,
  ) {
    const startedAt = Date.now();
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn('Password update rejected because user was not found', AuthService.name, {
        userId,
      });
      throw new UnauthorizedException('用户不存在');
    }

    const isOldValid = bcrypt.compareSync(dto.oldPassword, user.password);
    if (!isOldValid) {
      this.logger.warn('Password update rejected because old password was invalid', AuthService.name, {
        userId,
      });
      throw new BadRequestException('旧密码错误');
    }

    user.password = bcrypt.hashSync(dto.newPassword, 10);
    await this.userRepo.save(user);

    await this.cacheManager.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken) as { exp?: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.cacheManager.set(
            `${BLACKLIST_PREFIX}${accessToken}`,
            '1',
            ttl * 1000,
          );
        }
      }
    }

    const tokens = await this.generateAndStoreTokens(user);

    this.logger.log('Password updated', AuthService.name, {
      userId,
      durationMs: Date.now() - startedAt,
    });

    return new Response('密码修改成功，请使用新 Token', tokens);
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn('Profile fetch rejected because user was not found', AuthService.name, {
        userId,
      });
      throw new UnauthorizedException('用户不存在');
    }

    return new Response('获取成功', this.sanitizeUser(user));
  }

  async sendVerificationCode(dto: SendVerificationCodeDto) {
    const startedAt = Date.now();
    const code = this.generateSecureCode(6);
    const maskedEmail = this.maskEmail(dto.email);

    await this.cacheManager.set(
      `${VERIFICATION_CODE_PREFIX}${dto.email}`,
      code,
      600000,
    );

    await this.emailService.sendEmail({
      toEmail: dto.email,
      subject: '邮箱验证码',
      htmlInfo: `您的邮箱验证码是：${code}，有效期为 10 分钟。`,
    });

    this.logger.log('Verification code sent', AuthService.name, {
      email: maskedEmail,
      durationMs: Date.now() - startedAt,
    });

    return new Response('验证码已发送，请查收邮件');
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const startedAt = Date.now();
    const maskedEmail = this.maskEmail(dto.email);
    const storedCode = await this.cacheManager.get<string>(
      `${VERIFICATION_CODE_PREFIX}${dto.email}`,
    );
    if (!storedCode || storedCode !== dto.code) {
      this.logger.warn('Email verification rejected because code was invalid', AuthService.name, {
        email: maskedEmail,
      });
      throw new BadRequestException('验证码错误或已过期');
    }

    await this.cacheManager.del(`${VERIFICATION_CODE_PREFIX}${dto.email}`);

    const resetToken = this.generateSecureCode(32);
    await this.cacheManager.set(
      `${RESET_PASSWORD_PREFIX}${dto.email}`,
      resetToken,
      1800000,
    );

    this.logger.log('Email verified for password reset', AuthService.name, {
      email: maskedEmail,
      durationMs: Date.now() - startedAt,
    });

    return new Response('邮箱验证成功', { resetToken });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const startedAt = Date.now();
    const maskedEmail = this.maskEmail(dto.email);
    const storedCode = await this.cacheManager.get<string>(
      `${VERIFICATION_CODE_PREFIX}${dto.email}`,
    );
    if (!storedCode || storedCode !== dto.code) {
      this.logger.warn('Password reset rejected because verification code was invalid', AuthService.name, {
        email: maskedEmail,
      });
      throw new BadRequestException('验证码错误或已过期');
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      this.logger.warn('Password reset rejected because user was not found', AuthService.name, {
        email: maskedEmail,
      });
      throw new BadRequestException('用户不存在');
    }

    user.password = bcrypt.hashSync(dto.newPassword, 10);
    await this.userRepo.save(user);

    await this.cacheManager.del(`${VERIFICATION_CODE_PREFIX}${dto.email}`);
    await this.cacheManager.del(`${RESET_PASSWORD_PREFIX}${dto.email}`);
    await this.cacheManager.del(`${REFRESH_TOKEN_PREFIX}${user.id}`);

    this.logger.log('Password reset completed', AuthService.name, {
      userId: user.id,
      email: maskedEmail,
      durationMs: Date.now() - startedAt,
    });

    return new Response('密码重置成功，请使用新密码登录');
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
    await this.cacheManager.set(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      refreshToken,
      refreshTtl * 1000,
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

  private generateSecureCode(length: number): string {
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(Math.ceil(length / 2));
    return bytes.toString('hex').slice(0, length).toUpperCase();
  }

  private maskEmail(email: string) {
    const [localPart, domain] = email.split('@');
    if (!domain) {
      return '***';
    }

    const maskedLocal = localPart.length > 1 ? `${localPart[0]}***` : '***';
    return `${maskedLocal}@${domain}`;
  }
}
