import {
  IsEnum,
  IsUUID,
  IsString,
  IsOptional,
  ValidateIf,
  IsPhoneNumber,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class InitiatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  // For Mobile Money payments
  @ValidateIf((o: InitiatePaymentDto) => o.method === PaymentMethod.MOMO)
  @IsString()
  @IsPhoneNumber('CM') // Cameroon phone number format
  phoneNumber?: string;

  // For Cash on Delivery
  @ValidateIf((o: InitiatePaymentDto) => o.method === PaymentMethod.COD)
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
