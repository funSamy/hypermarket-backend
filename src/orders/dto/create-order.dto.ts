import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsPositive,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product to order',
    example: 2,
    minimum: 1,
    type: 'integer',
  })
  @IsInt()
  @IsPositive()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Array of items to include in the order',
    type: [OrderItemDto],
    example: [
      {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2,
      },
      {
        productId: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 1,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Delivery address for the order',
    example: '123 Main St, Apt 4B, New York, NY 10001',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({
    description: 'Latitude coordinate for delivery location',
    example: 40.7128,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  deliveryLatitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate for delivery location',
    example: -74.006,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  deliveryLongitude?: number;
}
