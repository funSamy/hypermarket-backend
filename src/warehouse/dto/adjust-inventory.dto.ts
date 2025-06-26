import { IsUUID, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustInventoryDto {
  @ApiProperty({
    description: 'UUID of the warehouse where inventory is being adjusted',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
    type: 'string',
  })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({
    description: 'UUID of the product for which inventory is being adjusted',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    type: 'string',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description:
      'New total quantity of the product in the warehouse (not a delta)',
    example: 150,
    minimum: 0,
    type: 'integer',
  })
  @IsInt()
  quantity: number;
}
