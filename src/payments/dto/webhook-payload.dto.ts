import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class WebhookPayloadDto {
  @IsString()
  transaction: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
