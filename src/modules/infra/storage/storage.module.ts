import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { IStorageProvider } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { STORAGE_PROVIDER } from './storage.constants';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): IStorageProvider => {
        const driver = configService.get('STORAGE_DRIVER', 'local');

        if (driver === 'local') {
          return new LocalStorageProvider(configService);
        }

        if (driver === 's3') {
          return new S3StorageProvider(configService);
        }

        throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
      },
    },
    StorageService,
  ],
  exports: [StorageService], // 导出供其他模块使用
})
export class StorageModule {}
