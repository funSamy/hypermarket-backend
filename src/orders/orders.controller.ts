import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersListResponseDto } from './dto/orders-list-response.dto';
import { OrderStatisticsResponseDto } from './dto/order-statistics-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { Role, User as PrismaUser } from '@prisma/client';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

type AuthenticatedUser = Omit<PrismaUser, 'passwordHash'>;

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new order',
    description: "Creates a new order from the user's cart items.",
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Order creation data',
    examples: {
      example1: {
        summary: 'Standard Order',
        description: 'Example of creating an order with delivery address',
        value: {
          deliveryAddress: '123 Main St, City, State 12345',
          notes: 'Please deliver after 6 PM',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or empty cart',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  create(
    @User() user: AuthenticatedUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user orders',
    description:
      'Retrieves all orders for the authenticated user. Admins can see all orders.',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: OrdersListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  findAll(@User() user: AuthenticatedUser) {
    return this.ordersService.findAll(user.id, user.role);
  }

  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get order statistics (Admin only)',
    description:
      'Retrieves comprehensive order statistics for all users. Admin access required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
    type: OrderStatisticsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Admin access required',
    type: ErrorResponseDto,
  })
  getStatistics() {
    return this.ordersService.getOrderStatistics();
  }

  @Get('my-statistics')
  @ApiOperation({
    summary: 'Get user order statistics',
    description: 'Retrieves order statistics for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User order statistics retrieved successfully',
    type: OrderStatisticsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  getMyStatistics(@User() user: AuthenticatedUser) {
    return this.ordersService.getOrderStatistics(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Retrieves a specific order by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @User() user: AuthenticatedUser,
  ) {
    return this.ordersService.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update order status (Admin only)',
    description:
      'Updates the status of an existing order. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiBody({
    type: UpdateOrderStatusDto,
    description: 'Order status update data',
    examples: {
      example1: {
        summary: 'Ship Order',
        description: 'Example of updating order to shipped status',
        value: {
          status: 'SHIPPED',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid status transition',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Admin access required',
    type: ErrorResponseDto,
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
