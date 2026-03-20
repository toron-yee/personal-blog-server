import { Module } from '@nestjs/common';
import { AppLoggerService } from './logging.service';
import { RequestContextService } from './request-context.service';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Module({
  providers: [AppLoggerService, RequestContextService, RequestLoggingInterceptor],
  exports: [AppLoggerService, RequestContextService, RequestLoggingInterceptor],
})
export class LoggingModule {}
