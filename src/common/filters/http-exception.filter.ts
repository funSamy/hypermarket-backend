import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors: Array<{
    field?: string;
    message: string;
    [key: string]: unknown;
  }>;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as
      | string
      | { message: string | string[]; error: string };

    let message = 'An error occurred';
    let errors: Array<{
      field?: string;
      message: string;
      [key: string]: unknown;
    }> = [];

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      errors = [{ message: exceptionResponse }];
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse;

      if (responseObj.message) {
        if (Array.isArray(responseObj.message)) {
          // Handle validation errors from class-validator
          message = 'Validation failed';
          errors = responseObj.message.map((msg: string) => ({
            message: msg,
            // Try to extract field name from validation message
            field: this.extractFieldFromValidationMessage(msg),
          }));
        } else {
          message = responseObj.message;
          errors = [{ message: responseObj.message }];
        }
      }

      if (responseObj.error) {
        message = responseObj.error;
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      message,
      errors,
    };

    response.status(status).json(errorResponse);
  }

  private extractFieldFromValidationMessage(
    message: string,
  ): string | undefined {
    // Try to extract field name from common validation message patterns
    const fieldMatch = message.match(/^(\w+)\s/);
    return fieldMatch ? fieldMatch[1] : undefined;
  }
}
