import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_PREFIX = 'cache_key_prefix';
export const CACHE_TTL_KEY = 'cache_ttl';

/**
 * 标记接口启用缓存
 * @param prefix 缓存 key 前缀
 * @param ttl 缓存时间（秒），默认 300s
 */
export const Cacheable = (prefix: string, ttl = 300) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_PREFIX, prefix)(target, key, descriptor);
    SetMetadata(CACHE_TTL_KEY, ttl)(target, key, descriptor);
    return descriptor;
  };
};
