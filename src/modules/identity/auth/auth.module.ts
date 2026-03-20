import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateLimitGuard } from '@/common/guards/rate-limit.guard';
import { EmailModule } from '@/modules/infra/email/email.module';
import { LoggingModule } from '@/modules/infra/logging/logging.module';
import { User } from '@/modules/identity/user/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({}),
    EmailModule,
    LoggingModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, RateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
