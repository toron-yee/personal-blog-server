import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { AppLoggerService } from '@/modules/infra/logging/logging.service';
import {
  AuthenticatedRequest,
  buildRequestContextMetadata,
  buildRequestLogMetadata,
  ensureRequestId,
} from '@/modules/infra/logging/request-context.util';
import { RequestContextService } from '@/modules/infra/logging/request-context.service';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<AuthenticatedRequest>();
    const response = ctx.getResponse<Response>();
    const requestId = ensureRequestId(request, response);
    this.requestContextService.enterWith(buildRequestContextMetadata(request, requestId));
    const baseMetadata = buildRequestLogMetadata(request, requestId);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else {
        const message = (exceptionResponse as any).message;
        errorMessage = Array.isArray(message) ? message[0] : message;
      }
    } else if (exception instanceof SyntaxError) {
      status = HttpStatus.BAD_REQUEST;
      errorMessage = 'JSON 格式错误，请检查请求体格式';
    }

    const metadata = {
      ...baseMetadata,
      statusCode: status,
      errorMessage,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        'Unhandled exception',
        HttpExceptionFilter.name,
        this.getStack(exception),
        metadata,
      );
    } else {
      this.logger.warn('Request rejected', HttpExceptionFilter.name, metadata);
    }

    response.status(200).json({
      code: status,
      success: false,
      message: errorMessage,
      data: null,
    });
  }

  private getStack(exception: unknown) {
    return exception instanceof Error ? exception.stack : undefined;
  }
}
