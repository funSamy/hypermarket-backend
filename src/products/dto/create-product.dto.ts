import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsUUID,
  IsUrl,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'iPhone 14 Pro',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the product',
    example: 'Latest iPhone with advanced camera system and A16 Bionic chip',
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Price of the product in XAF',
    example: 999.99,
    minimum: 0.01,
    type: 'number',
    format: 'decimal',
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Array of product image URLs',
    example: [
      'https://example.com/iphone14pro-front.jpg',
      'https://example.com/iphone14pro-back.jpg',
      'https://example.com/iphone14pro-side.jpg',
    ],
    type: [String],
    minItems: 1,
    maxItems: 10,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product image is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 product images allowed' })
  @IsUrl({}, { each: true, message: 'Each product image must be a valid URL' })
  @Type(() => String)
  image: string[];

  @ApiProperty({
    description: 'Category ID this product belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  categoryId: string;
}
