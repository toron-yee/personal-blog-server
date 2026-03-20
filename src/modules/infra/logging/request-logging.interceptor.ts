import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AppLoggerService } from './logging.service';
import {
  AuthenticatedRequest,
  buildRequestContextMetadata,
  buildRequestLogMetadata,
  ensureRequestId,
} from './request-context.util';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<Response>();
    const requestId = ensureRequestId(request, response);
    const requestContext = buildRequestContextMetadata(request, requestId);
    const baseMetadata = buildRequestLogMetadata(request, requestId);
    const startedAt = Date.now();

    return this.requestContextService.run(requestContext, () => {
      this.logger.log('Request started', 'HTTP', baseMetadata);

      return next.handle().pipe(
        tap(() => {
          this.logger.log('Request completed', 'HTTP', {
            ...baseMetadata,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          });
        }),
        catchError((error: unknown) => {
          this.logger.warn('Request failed', 'HTTP', {
            ...baseMetadata,
            statusCode: this.resolveStatusCode(error, response.statusCode),
            durationMs: Date.now() - startedAt,
          });

          return throwError(() => error);
        }),
      );
    });
  }

  private resolveStatusCode(error: unknown, currentStatusCode: number) {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    return currentStatusCode >= 400 ? currentStatusCode : 500;
  }
}
