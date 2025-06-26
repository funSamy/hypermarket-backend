import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @ApiProperty({
    description: 'Unique identifier for the cart',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns the cart',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'Array of items in the cart',
    type: [CartItemDto],
  })
  items: CartItemDto[];

  @ApiProperty({
    description: 'Total number of items in the cart',
    example: 5,
    minimum: 0,
    type: 'integer',
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total amount for all items in the cart',
    example: 2499.99,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Date and time when the cart was created',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date and time when the cart was last updated',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
