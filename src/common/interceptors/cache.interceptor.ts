import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Response } from '@/common/utils/response';
import { CACHE_KEY_PREFIX, CACHE_TTL_KEY } from '@/common/decorators/cache.decorator';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const prefix = this.reflector.get<string>(CACHE_KEY_PREFIX, context.getHandler());
    if (!prefix) return next.handle();

    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || 300;
    const request = context.switchToHttp().getRequest<Request>();
    const cacheKey = this.buildCacheKey(prefix, request);

    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return of(new Response(parsed.message, parsed.data));
    }

    return next.handle().pipe(
      tap(async (response) => {
        if (response instanceof Response) {
          await this.cacheManager.set(cacheKey, JSON.stringify(response), ttl * 1000); // 转换为毫秒
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
