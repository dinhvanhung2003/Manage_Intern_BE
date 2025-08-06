import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    response.status(status).json({
      status,
      result: 1,
      message: typeof errorResponse === 'string' ? errorResponse : (errorResponse as any).message || 'Lỗi',
      data: null,
      error: errorResponse
    });
  }
}
