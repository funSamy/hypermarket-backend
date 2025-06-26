import { ApiProperty } from '@nestjs/swagger';

export class PaymentDataDto {
  @ApiProperty({
    description: 'Payment unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Payment method used',
    example: 'MOMO',
    enum: ['MOMO', 'COD'],
  })
  method: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'PENDING',
    enum: ['PENDING', 'SUCCEEDED', 'FAILED'],
  })
  status: string;

  @ApiProperty({
    description: 'Transaction identifier',
    example: 'TXN_1234567890',
  })
  transaction: string;

  @ApiProperty({
    description: 'Payment URL for mobile money (if applicable)',
    example: 'https://api.fapshi.com/pay/txn123',
    required: false,
  })
  paymentUrl?: string;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Payment initiated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Payment data',
    type: PaymentDataDto,
  })
  data: PaymentDataDto;
}
