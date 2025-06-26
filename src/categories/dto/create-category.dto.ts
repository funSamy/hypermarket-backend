import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Name of the category',
    example: 'Electronics',
    minLength: 1,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the category',
    example: 'Electronic devices, gadgets, and accessories',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Optional category image URL',
    example: 'https://example.com/electronics-category.jpg',
    format: 'uri',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Category image must be a valid URL' })
  image?: string;
}
