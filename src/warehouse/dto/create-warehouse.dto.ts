import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsLatitude,
  IsLongitude,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({
    description: 'Name of the warehouse',
    example: 'Buea Central Warehouse',
    minLength: 1,
    maxLength: 255,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Latitude coordinate of the warehouse location',
    example: 4.1535,
    minimum: -90,
    maximum: 90,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of the warehouse location',
    example: 9.287,
    minimum: -180,
    maximum: 180,
    type: 'number',
    format: 'float',
  })
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiProperty({
    description: 'Storage capacity of the warehouse (in units)',
    example: 10000,
    minimum: 1,
    type: 'integer',
  })
  @IsInt()
  @Min(1)
  capacity: number;
}
