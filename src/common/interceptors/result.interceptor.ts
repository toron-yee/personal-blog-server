import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '../utils/response';

@Injectable()
export class ResultInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        if (data instanceof Response) {
          return {
            code: HttpStatus.OK,
            success: true,
            message: data.message,
            data: data.data,
          };
        }
        return {
          code: HttpStatus.OK,
          success: true,
          message: '操作成功',
          data,
        };
      }),
    );
  }
}