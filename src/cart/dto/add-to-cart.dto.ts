import { IsNumber, IsPositive, IsInt, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product to add to cart',
    example: 2,
    minimum: 1,
    type: 'integer',
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  quantity: number;
}
