import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import {
  InventoryListResponseDto,
  InventoryAdjustmentResponseDto,
} from './dto/inventory-response.dto';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':warehouseId')
  @ApiOperation({
    summary: 'Retrieve warehouse inventory',
    description:
      'Returns a paginated list of all inventory items for a specific warehouse, including detailed product and category information. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'warehouseId',
    description: 'Warehouse unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    example: 1,
    required: false,
    type: 'integer',
    minimum: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    example: 10,
    required: false,
    type: 'integer',
    minimum: 1,
    maximum: 100,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse inventory retrieved successfully',
    type: InventoryListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format or pagination parameters',
    type: ErrorResponseDto,
    examples: {
      invalidUuid: {
        summary: 'Invalid UUID format error',
        value: {
          success: false,
          message: 'Validation failed (uuid is expected)',
          errors: [],
        },
      },
      invalidPagination: {
        summary: 'Invalid pagination parameters',
        value: {
          success: false,
          message: 'Validation failed',
          errors: [
            {
              field: 'page',
              message: 'page must be a positive integer',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
    type: ErrorResponseDto,
    examples: {
      warehouseNotFound: {
        summary: 'Warehouse not found error',
        value: {
          success: false,
          message:
            'Warehouse with ID 550e8400-e29b-41d4-a716-446655440000 not found',
          errors: [],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
    type: ErrorResponseDto,
  })
  async getInventoryForWarehouse(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return await this.inventoryService.getInventoryForWarehouse(
      warehouseId,
      page,
      limit,
    );
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Adjust inventory levels',
    description:
      'Updates or creates inventory records for a product in a warehouse. This endpoint performs an upsert operation - it will update existing inventory or create new inventory records as needed. Only accessible by administrators.',
  })
  @ApiBody({
    description: 'Inventory adjustment data',
    type: AdjustInventoryDto,
    examples: {
      newInventory: {
        summary: 'Add new product to warehouse',
        description: 'Example of adding a new product to a warehouse inventory',
        value: {
          warehouseId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 100,
        },
      },
      updateInventory: {
        summary: 'Update existing inventory',
        description: 'Example of updating quantity for existing inventory',
        value: {
          warehouseId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '456e7890-e12b-34c5-d678-901234567890',
          quantity: 250,
        },
      },
      zeroInventory: {
        summary: 'Set inventory to zero',
        description:
          'Example of setting inventory quantity to zero (out of stock)',
        value: {
          warehouseId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '789e0123-e45b-67c8-d901-234567890123',
          quantity: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory adjusted successfully',
    type: InventoryAdjustmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'New inventory record created successfully',
    type: InventoryAdjustmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation errors',
    type: ErrorResponseDto,
    examples: {
      validationError: {
        summary: 'Validation error response',
        value: {
          success: false,
          message: 'Validation failed',
          errors: [
            {
              field: 'warehouseId',
              message: 'warehouseId must be a UUID',
            },
            {
              field: 'quantity',
              message: 'quantity must be an integer',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse or product not found',
    type: ErrorResponseDto,
    examples: {
      warehouseNotFound: {
        summary: 'Warehouse not found error',
        value: {
          success: false,
          message:
            'Warehouse with ID 550e8400-e29b-41d4-a716-446655440000 not found',
          errors: [],
        },
      },
      productNotFound: {
        summary: 'Product not found error',
        value: {
          success: false,
          message:
            'Product with ID 123e4567-e89b-12d3-a456-426614174000 not found',
          errors: [],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin access required',
    type: ErrorResponseDto,
  })
  async adjustInventory(
    @Body() adjustInventoryDto: AdjustInventoryDto,
  ): Promise<any> {
    return await this.inventoryService.adjustInventory(adjustInventoryDto);
  }
}
