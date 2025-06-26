import {
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsUUID,
  IsUrl,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  @Type(() => String)
  image?: string[];

  @IsOptional()
  @IsString()
  @IsUUID()
  categoryId?: string;
}
