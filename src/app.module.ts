import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { SystemModule } from './modules/system/system.module';
import { CommonModule } from './modules/common/common.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { StorageModule } from './modules/storage/storage.module';

const env = process.env.NODE_ENV || 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${env}`, '.env'],
    }),
    CacheModule.registerAsync({
      isGlobal: true, // 全局可用
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const cacheStore = configService.get('CACHE_STORE', 'memory');

        if (cacheStore === 'redis') {
          // 使用 Redis 存储
          return {
            store: await redisStore({
              socket: {
                host: configService.get('REDIS_HOST', 'localhost'),
                port: configService.get('REDIS_PORT', 6379),
              },
              password: configService.get('REDIS_PASSWORD'),
              database: configService.get('REDIS_DB', 0),
            }),
            ttl: 600 * 1000, // 10 分钟（毫秒）
          };
        }

        // 默认使用内存缓存
        return {
          ttl: 600 * 1000, // 10 分钟（毫秒）
          max: 100, // 最多缓存 100 个项目
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.get('DB_TYPE', 'mysql') as any,
        host: configService.get('DB_HOST', 'localhost'),
        port: +configService.get('DB_PORT', '3306'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        logging: configService.get('DB_LOGGING') === 'true',
        entities: [],
        autoLoadEntities: true,
        keepConnectionAlive: true,
        timezone: '+08:00',
      } as TypeOrmModuleOptions),
    }),
    CommonModule,
    SystemModule,
    StorageModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
