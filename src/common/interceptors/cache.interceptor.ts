import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { RedisService } from '@/modules/common/redis/redis.service';
import { Response } from '@/common/utils/response';
import { CACHE_KEY_PREFIX, CACHE_TTL_KEY } from '@/common/decorators/cache.decorator';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const prefix = this.reflector.get<string>(CACHE_KEY_PREFIX, context.getHandler());
    if (!prefix) return next.handle();

    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || 300;
    const request = context.switchToHttp().getRequest<Request>();
    const cacheKey = this.buildCacheKey(prefix, request);

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return of(new Response(parsed.message, parsed.data));
    }

    return next.handle().pipe(
      tap(async (response) => {
        if (response instanceof Response) {
          await this.redisService.set(cacheKey, JSON.stringify(response), ttl);
        }
      }),
    );
  }

  private buildCacheKey(prefix: string, request: Request): string {
    const userId = (request as any).user?.id || 'anon';
    const params = Object.keys(request.params).length
      ? ':' + Object.values(request.params).join(':')
      : '';
    const query = Object.keys(request.query).length
      ? ':' + Buffer.from(JSON.stringify(request.query)).toString('base64url')
      : '';
    return `cache:${prefix}:${userId}${params}${query}`;
  }
}
