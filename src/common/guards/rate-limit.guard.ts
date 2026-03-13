import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface RateLimitOptions {
  ttl: number; // 时间窗口（秒）
  limit: number; // 最大请求次数
  keyPrefix?: string; // key 前缀
  keyGenerator?: (context: ExecutionContext) => string; // 自定义 key 生成器
}

export const RATE_LIMIT_KEY = 'rate_limit';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = options.keyGenerator
      ? options.keyGenerator(context)
      : this.getDefaultKey(request, options.keyPrefix);

    const current = await this.cacheManager.get<number>(key);
    const count = current || 0;

    if (count >= options.limit) {
      throw new HttpException(
        '请求过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.cacheManager.set(key, count + 1, options.ttl * 1000); // 转换为毫秒
    return true;
  }

  private getDefaultKey(request: any, prefix = 'rate_limit'): string {
    const ip = request.ip || request.connection.remoteAddress;
    return `${prefix}:${ip}`;
  }
}
