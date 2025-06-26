import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailDto {
  @ApiProperty({
    description: 'Field name where the error occurred (optional)',
    example: 'email',
    required: false,
  })
  field?: string;

  @ApiProperty({
    description: 'Error message describing what went wrong',
    example: 'Email must be a valid email address',
  })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'General error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'Array of detailed error information',
    type: [ErrorDetailDto],
    example: [
      {
        field: 'email',
        message: 'Email must be a valid email address',
      },
      {
        field: 'password',
        message: 'Password must be at least 6 characters long',
      },
    ],
  })
  errors: ErrorDetailDto[];
}
