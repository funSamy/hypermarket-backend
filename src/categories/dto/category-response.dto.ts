import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Category retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Category data',
    type: CategoryDto,
  })
  data: CategoryDto;
}
