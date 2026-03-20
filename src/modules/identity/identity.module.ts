import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/identity/auth/auth.module';
import { UserModule } from '@/modules/identity/user/user.module';
import { AiProfileModule } from './ai-profile/ai-profile.module';

@Module({
  imports: [AuthModule, UserModule, AiProfileModule],
  exports: [AuthModule, UserModule, AiProfileModule],
})
export class IdentityModule {}
