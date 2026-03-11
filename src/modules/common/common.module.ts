import { Module, Global } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { RedisModule } from './redis/redis.module';

@Global()
@Module({
  imports: [EmailModule, RedisModule],
  exports: [RedisModule],
})
export class CommonModule {}
