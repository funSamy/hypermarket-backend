import { ApiProperty } from '@nestjs/swagger';

export class InventoryProductDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Samsung Galaxy S23',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'Product description',
    example:
      'Latest Samsung flagship smartphone with advanced camera technology',
    type: 'string',
  })
  description: string;

  @ApiProperty({
    description: 'Product price in XAF (Central African Francs)',
    example: 850000,
    type: 'number',
    format: 'decimal',
  })
  price: number;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/images/samsung-s23.jpg',
    type: 'string',
  })
  image: string;

  @ApiProperty({
    description: 'Product category information',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: 'cat-123e4567-e89b-12d3-a456-426614174000',
      },
      name: {
        type: 'string',
        example: 'Electronics',
      },
      description: {
        type: 'string',
        example: 'Electronic devices and accessories',
      },
    },
  })
  category: {
    id: string;
    name: string;
    description: string;
  };
}

export class InventoryWarehouseDto {
  @ApiProperty({
    description: 'Warehouse unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Warehouse name',
    example: 'Buea Central Warehouse',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'Warehouse latitude coordinate',
    example: 4.1535,
    type: 'number',
    format: 'float',
  })
  latitude: number;

  @ApiProperty({
    description: 'Warehouse longitude coordinate',
    example: 9.287,
    type: 'number',
    format: 'float',
  })
  longitude: number;
}

export class InventoryDto {
  @ApiProperty({
    description: 'Inventory record unique identifier',
    example: '789e0123-e45b-67c8-d901-234567890123',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Quantity of the product available in the warehouse',
    example: 150,
    minimum: 0,
    type: 'integer',
  })
  quantity: number;

  @ApiProperty({
    description: 'Product information',
    type: InventoryProductDto,
  })
  product: InventoryProductDto;

  @ApiProperty({
    description: 'Warehouse information',
    type: InventoryWarehouseDto,
  })
  warehouse: InventoryWarehouseDto;
}

export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
    type: 'integer',
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    type: 'integer',
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of inventory items',
    example: 45,
    minimum: 0,
    type: 'integer',
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
    minimum: 0,
    type: 'integer',
  })
  totalPages: number;
}

export class InventoryListDataDto {
  @ApiProperty({
    description: 'Array of inventory items',
    type: [InventoryDto],
  })
  data: InventoryDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

export class InventoryListResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Warehouse inventory retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Inventory data with pagination',
    type: InventoryListDataDto,
  })
  data: InventoryListDataDto;
}

export class InventoryAdjustmentResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Inventory adjusted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Updated inventory record',
    type: InventoryDto,
  })
  data: InventoryDto;
}
