import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    description: 'Unique identifier for the category',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the category',
    example: 'Electronics',
    minLength: 1,
    maxLength: 100,
  })
  name: string;

  @ApiProperty({
    description: 'Description of the category',
    example: 'Electronic devices and gadgets',
    maxLength: 500,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Optional category image URL',
    example: 'https://example.com/electronics-category.jpg',
    format: 'uri',
    required: false,
  })
  image?: string;

  @ApiProperty({
    description: 'Date and time when the category was created',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date and time when the category was last updated',
    example: '2023-01-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
