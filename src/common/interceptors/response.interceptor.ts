import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown): ApiResponse<T> => {
        // Handle cases where the controller already returns a formatted response
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Handle cases where the controller returns a single object
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return {
            success: true,
            message: 'Operation completed successfully',
            data: data as T,
          };
        }

        // Default success response structure
        return {
          success: true,
          message: 'Operation completed successfully',
          data: data as T,
        };
      }),
    );
  }
}
