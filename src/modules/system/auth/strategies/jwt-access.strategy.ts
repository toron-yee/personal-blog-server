import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '@/modules/system/user/entities/user.entity';
import { RedisService } from '@/modules/common/redis/redis.service';

const BLACKLIST_PREFIX = 'auth:blacklist:';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const isBlacklisted = await this.redisService.exists(`${BLACKLIST_PREFIX}${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token 已失效，请重新登录');
      }
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    return user;
  }
}
