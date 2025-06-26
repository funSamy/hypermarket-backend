import { ApiProperty } from '@nestjs/swagger';

export class PaymentProviderDto {
  @ApiProperty({
    description: 'Provider name',
    example: 'MTN Mobile Money',
  })
  name: string;

  @ApiProperty({
    description: 'Provider code',
    example: 'MTN_MOMO',
  })
  code: string;

  @ApiProperty({
    description: 'Phone number prefixes supported',
    example: ['650', '651', '652'],
    type: [String],
  })
  prefix: string[];
}

export class PaymentMethodDto {
  @ApiProperty({
    description: 'Payment method code',
    example: 'MOMO',
    enum: ['MOMO', 'COD'],
  })
  code: string;

  @ApiProperty({
    description: 'Payment method name',
    example: 'Mobile Money',
  })
  name: string;

  @ApiProperty({
    description: 'Payment method description',
    example:
      'Pay using MTN Mobile Money, Orange Money, or Express Union Mobile',
  })
  description: string;

  @ApiProperty({
    description: 'Whether this payment method is currently available',
    example: true,
  })
  isAvailable: boolean;
}

export class PaymentProvidersDataDto {
  @ApiProperty({
    description: 'Available mobile money providers',
    type: [PaymentProviderDto],
  })
  mobileMoneyProviders: PaymentProviderDto[];

  @ApiProperty({
    description: 'Available payment methods',
    type: [PaymentMethodDto],
  })
  paymentMethods: PaymentMethodDto[];
}

export class PaymentProvidersResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Payment providers retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Payment providers data',
    type: PaymentProvidersDataDto,
  })
  data: PaymentProvidersDataDto;
}
