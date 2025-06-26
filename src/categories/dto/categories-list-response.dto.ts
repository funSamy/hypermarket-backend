import { ApiProperty } from '@nestjs/swagger';
import { CategoryDto } from './category.dto';

export class CategoriesListResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Categories retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of categories',
    type: [CategoryDto],
  })
  data: CategoryDto[];
}
