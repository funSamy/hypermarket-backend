import { ApiProperty } from '@nestjs/swagger';
import { CartDto } from './cart.dto';

export class CartResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Cart retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Cart data with items',
    type: CartDto,
  })
  data: CartDto;
}
