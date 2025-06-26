import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from '../../categories/dto/category.dto';

export class WarehouseDto {
  @ApiProperty({
    description: 'Unique identifier for the warehouse',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the warehouse',
    example: 'Main Warehouse',
  })
  name: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
  })
  longitude: number;

  @ApiProperty({
    description: 'Warehouse capacity',
    example: 1000,
  })
  capacity: number;
}

export class InventoryDto {
  @ApiProperty({
    description: 'Warehouse information',
    type: WarehouseDto,
  })
  warehouse: WarehouseDto;

  @ApiProperty({
    description: 'Quantity in stock at this warehouse',
    example: 25,
  })
  quantity: number;
}

export class ProductDto {
  @ApiProperty({
    description: 'Unique identifier for the product',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the product',
    example: 'iPhone 14 Pro',
    minLength: 1,
    maxLength: 255,
  })
  name: string;

  @ApiProperty({
    description: 'Detailed description of the product',
    example: 'Latest iPhone with advanced camera system and A16 Bionic chip',
    maxLength: 1000,
  })
  description: string;

  @ApiProperty({
    description: 'Price of the product in USD',
    example: 999.99,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  price: number;

  @ApiProperty({
    description: 'Array of product image URLs',
    example: [
      'https://example.com/iphone14pro-front.jpg',
      'https://example.com/iphone14pro-back.jpg',
      'https://example.com/iphone14pro-side.jpg',
    ],
    type: [String],
  })
  image: string[];

  @ApiProperty({
    description: 'Category ID this product belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category this product belongs to',
    type: CategoryDto,
  })
  category: CategoryDto;

  @ApiProperty({
    description: 'Total stock across all warehouses',
    example: 50,
    minimum: 0,
    type: 'integer',
    required: false,
  })
  totalStock?: number;

  @ApiProperty({
    description: 'Number of warehouses with available stock',
    example: 3,
    minimum: 0,
    type: 'integer',
    required: false,
  })
  availableWarehouses?: number;

  @ApiProperty({
    description: 'Inventory information across warehouses',
    type: [InventoryDto],
    required: false,
  })
  inventories?: InventoryDto[];
}
