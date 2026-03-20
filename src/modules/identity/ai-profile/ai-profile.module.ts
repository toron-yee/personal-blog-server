import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProfileService } from './ai-profile.service';
import { AiProfileController } from './ai-profile.controller';
import { AiProfile } from './entities/ai-profile.entity';
import { UserModule } from '@/modules/identity/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiProfile]), UserModule],
  controllers: [AiProfileController],
  providers: [AiProfileService],
  exports: [AiProfileService],
})
export class AiProfileModule {}
