import { ApiProperty } from '@nestjs/swagger';
import { PaymentDataDto } from './payment-response.dto';

export class PaymentHistoryResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Payment history retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of payment records',
    type: [PaymentDataDto],
  })
  data: PaymentDataDto[];
}
