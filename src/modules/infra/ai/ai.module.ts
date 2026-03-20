import { Module } from '@nestjs/common';
import { LoggingModule } from '@/modules/infra/logging/logging.module';
import { HunyuanService } from './hunyuan.service';

@Module({
  imports: [LoggingModule],
  providers: [HunyuanService],
  exports: [HunyuanService],
})
export class AiModule {}
