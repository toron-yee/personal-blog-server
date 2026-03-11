import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else {
        const msg = (exceptionResponse as any).message;
        errorMessage = Array.isArray(msg) ? msg[0] : msg;
      }
    } else if (exception instanceof SyntaxError) {
      status = HttpStatus.BAD_REQUEST;
      errorMessage = 'JSON 格式错误，请检查请求体格式';
    }

    response.status(200).json({
      code: status,
      success: false,
      message: errorMessage,
      data: null,
    });
  }
}