import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from '../../products/dto/product.dto';

export class OrderItemDto {
  @ApiProperty({
    description: 'Unique identifier for the order item',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Order ID this item belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  orderId: string;

  @ApiProperty({
    description: 'Product ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  productId: string;

  @ApiProperty({
    description: 'Product details',
    type: ProductDto,
  })
  product: ProductDto;

  @ApiProperty({
    description: 'Quantity of the product ordered',
    example: 2,
    minimum: 1,
    type: 'integer',
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the product at the time of order',
    example: 999.99,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  unitPrice: number;

  @ApiProperty({
    description: 'Total price for this order item (quantity × unit price)',
    example: 1999.98,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  totalPrice: number;
}
