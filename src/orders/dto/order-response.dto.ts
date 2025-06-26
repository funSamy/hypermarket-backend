import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from './order.dto';

export class OrderResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Order created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Order data',
    type: OrderDto,
  })
  data: OrderDto;
}
