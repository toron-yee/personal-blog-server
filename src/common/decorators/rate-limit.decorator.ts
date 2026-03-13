import { SetMetadata } from '@nestjs/common';
import { RateLimitOptions, RATE_LIMIT_KEY } from '@/common/guards/rate-limit.guard';

/**
 * 速率限制装饰器
 * @param options 限流配置
 * @example
 * // 限制 60 秒内最多 5 次请求
 * @RateLimit({ ttl: 60, limit: 5 })
 *
 * // 基于邮箱限流
 * @RateLimit({
 *   ttl: 60,
 *   limit: 1,
 *   keyPrefix: 'email_send',
 *   keyGenerator: (ctx) => {
 *     const request = ctx.switchToHttp().getRequest();
 *     return `email_send:${request.body.email}`;
 *   }
 * })
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
