import { ApiProperty } from '@nestjs/swagger';

export class OrderStatisticsDto {
  @ApiProperty({
    description: 'Total number of orders',
    example: 156,
    minimum: 0,
    type: 'integer',
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Number of pending orders',
    example: 12,
    minimum: 0,
    type: 'integer',
  })
  pendingOrders: number;

  @ApiProperty({
    description: 'Number of processing orders',
    example: 8,
    minimum: 0,
    type: 'integer',
  })
  processingOrders: number;

  @ApiProperty({
    description: 'Number of shipped orders',
    example: 25,
    minimum: 0,
    type: 'integer',
  })
  shippedOrders: number;

  @ApiProperty({
    description: 'Number of delivered orders',
    example: 108,
    minimum: 0,
    type: 'integer',
  })
  deliveredOrders: number;

  @ApiProperty({
    description: 'Number of cancelled orders',
    example: 3,
    minimum: 0,
    type: 'integer',
  })
  cancelledOrders: number;

  @ApiProperty({
    description: 'Total revenue from all orders',
    example: 125750.5,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Average order value',
    example: 806.09,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Orders placed this month',
    example: 42,
    minimum: 0,
    type: 'integer',
  })
  ordersThisMonth: number;

  @ApiProperty({
    description: 'Revenue for this month',
    example: 33890.25,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  revenueThisMonth: number;
}

export class OrderStatisticsResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Order statistics retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Order statistics data',
    type: OrderStatisticsDto,
  })
  data: OrderStatisticsDto;
}
