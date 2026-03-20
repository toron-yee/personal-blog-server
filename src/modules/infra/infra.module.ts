import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { LoggingModule } from './logging/logging.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [EmailModule, StorageModule, AiModule, LoggingModule],
  exports: [EmailModule, StorageModule, AiModule, LoggingModule],
})
export class InfraModule {}
