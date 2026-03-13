import { Module, Global } from '@nestjs/common';
import { EmailModule } from './email/email.module';

@Global()
@Module({
  imports: [EmailModule],
  exports: [],
})
export class CommonModule {}
