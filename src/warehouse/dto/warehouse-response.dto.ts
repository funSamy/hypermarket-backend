import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemDto {
  @ApiProperty({
    description: 'Inventory item unique identifier',
    example: '789e0123-e45b-67c8-d901-234567890123',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Quantity of the product in this warehouse',
    example: 75,
    minimum: 0,
    type: 'integer',
  })
  quantity: number;

  @ApiProperty({
    description: 'Product information',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      name: {
        type: 'string',
        example: 'Samsung Galaxy S23',
      },
      description: {
        type: 'string',
        example: 'Latest Samsung flagship smartphone with advanced camera',
      },
      price: {
        type: 'number',
        format: 'decimal',
        example: 850000,
      },
      image: {
        type: 'string',
        example: 'https://example.com/images/samsung-s23.jpg',
      },
      category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Electronics' },
          description: {
            type: 'string',
            example: 'Electronic devices and accessories',
          },
        },
      },
    },
  })
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: {
      id: string;
      name: string;
      description: string;
    };
  };
}

export class WarehouseDto {
  @ApiProperty({
    description: 'Warehouse unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the warehouse',
    example: 'Buea Central Warehouse',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'Latitude coordinate of the warehouse location',
    example: 4.1535,
    type: 'number',
    format: 'float',
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of the warehouse location',
    example: 9.287,
    type: 'number',
    format: 'float',
  })
  longitude: number;

  @ApiProperty({
    description: 'Storage capacity of the warehouse (in units)',
    example: 10000,
    type: 'integer',
  })
  capacity: number;

  @ApiProperty({
    description: 'List of inventory items in this warehouse',
    type: [InventoryItemDto],
    required: false,
  })
  inventories?: InventoryItemDto[];
}

export class WarehouseResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Warehouse retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Warehouse data with inventory information',
    type: WarehouseDto,
  })
  data: WarehouseDto;
}

export class WarehousesListResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Warehouses retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of warehouses with their inventory data',
    type: [WarehouseDto],
  })
  data: WarehouseDto[];
}

export class WarehouseDeleteResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Warehouse deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Deletion confirmation data',
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Warehouse deleted successfully',
      },
    },
  })
  data: {
    message: string;
  };
}
