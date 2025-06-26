import { ApiProperty } from '@nestjs/swagger';
import { OrderItemDto } from './order-item.dto';
import { UserDto } from '../../auth/dto/user.dto';

export class OrderDto {
  @ApiProperty({
    description: 'Unique identifier for the order',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who placed the order',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'User information',
    type: UserDto,
  })
  user: UserDto;

  @ApiProperty({
    description: 'Array of items in the order',
    type: [OrderItemDto],
  })
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Current status of the order',
    example: 'PENDING_PAYMENT',
    enum: [
      'PENDING_PAYMENT',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'FAILED',
    ],
  })
  status: string;

  @ApiProperty({
    description: 'Total amount for the order',
    example: 2499.99,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Delivery address for the order',
    example: '123 Main St, Apt 4B, New York, NY 10001',
    maxLength: 500,
    required: false,
  })
  deliveryAddress?: string;

  @ApiProperty({
    description: 'Latitude coordinate for delivery location',
    example: 40.7128,
    required: false,
  })
  deliveryLatitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate for delivery location',
    example: -74.006,
    required: false,
  })
  deliveryLongitude?: number;

  @ApiProperty({
    description: 'Date and time when the order was placed',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  orderDate: Date;

  @ApiProperty({
    description: 'Date and time when the order was last updated',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
