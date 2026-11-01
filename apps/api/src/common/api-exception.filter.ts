import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Please check the highlighted fields and try again.',
        details: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      });
      return;
    }
    if (error instanceof HttpException) {
      const statusCode = error.getStatus();
      const body = error.getResponse();
      const record = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
      response.status(statusCode).json({
        statusCode,
        code: typeof record.code === 'string' ? record.code : 'REQUEST_FAILED',
        message: typeof record.message === 'string' ? record.message : 'The request could not be completed.',
      });
      return;
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' });
  }
}
