import { ApiProperty } from '@nestjs/swagger';

export class PaymentVerificationDataDto {
  @ApiProperty({
    description: 'Payment information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'SUCCEEDED',
      method: 'MOMO',
      transaction: 'TXN_1234567890',
      paidAt: '2023-01-01T00:00:00.000Z',
    },
  })
  payment: any;

  @ApiProperty({
    description: 'Order information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      status: 'PROCESSING',
      totalAmount: 999.99,
    },
  })
  order: any;

  @ApiProperty({
    description: 'Verification result from payment provider',
    example: {
      status: 'SUCCEEDED',
      paidAt: '2023-01-01T00:00:00.000Z',
    },
    required: false,
  })
  verification?: any;
}

export class PaymentVerificationResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Payment status verified',
  })
  message: string;

  @ApiProperty({
    description: 'Payment verification data',
    type: PaymentVerificationDataDto,
  })
  data: PaymentVerificationDataDto;
}
