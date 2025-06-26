import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from './order.dto';

export class OrdersListResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Orders retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of orders',
    type: [OrderDto],
  })
  data: OrderDto[];
}
