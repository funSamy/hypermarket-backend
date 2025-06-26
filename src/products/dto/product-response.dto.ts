import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from './product.dto';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Product retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Product data',
    type: ProductDto,
  })
  data: ProductDto;
}
