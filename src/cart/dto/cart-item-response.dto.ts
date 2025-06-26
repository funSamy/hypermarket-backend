import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class CartItemResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Item added to cart successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Cart item data',
    type: CartItemDto,
  })
  data: CartItemDto;
}
