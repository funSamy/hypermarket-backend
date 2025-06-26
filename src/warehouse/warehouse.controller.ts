import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import {
  WarehouseResponseDto,
  WarehousesListResponseDto,
  WarehouseDeleteResponseDto,
} from './dto/warehouse-response.dto';

@ApiTags('Warehouses')
@ApiBearerAuth('JWT-auth')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new warehouse',
    description:
      'Creates a new warehouse with specified name, location coordinates, and storage capacity. Only accessible by administrators.',
  })
  @ApiBody({
    description: 'Warehouse creation data',
    type: CreateWarehouseDto,
    examples: {
      example1: {
        summary: 'Buea Central Warehouse',
        description: 'Example of creating a warehouse in Buea',
        value: {
          name: 'Buea Central Warehouse',
          latitude: 4.1535,
          longitude: 9.287,
          capacity: 10000,
        },
      },
      example2: {
        summary: 'Douala Port Warehouse',
        description: 'Example of creating a warehouse in Douala',
        value: {
          name: 'Douala Port Warehouse',
          latitude: 4.0511,
          longitude: 9.7679,
          capacity: 25000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Warehouse created successfully',
    type: WarehouseResponseDto,
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
              field: 'latitude',
              message: 'latitude must be a valid latitude',
            },
            {
              field: 'capacity',
              message: 'capacity must be at least 1',
            },
          ],
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
  async create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return await this.warehouseService.create(createWarehouseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all warehouses',
    description:
      'Returns a list of all warehouses with their complete inventory information. Only accessible by administrators.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouses retrieved successfully',
    type: WarehousesListResponseDto,
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
  async findAll() {
    return await this.warehouseService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Retrieve a specific warehouse',
    description:
      'Returns detailed information about a warehouse including its complete inventory list. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'Warehouse unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse retrieved successfully',
    type: WarehouseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format',
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
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
    type: ErrorResponseDto,
    examples: {
      notFound: {
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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.warehouseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a warehouse',
    description:
      'Updates warehouse information such as name, location coordinates, or capacity. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'Warehouse unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @ApiBody({
    description: 'Warehouse update data (all fields are optional)',
    type: UpdateWarehouseDto,
    examples: {
      nameUpdate: {
        summary: 'Update warehouse name',
        description: 'Example of updating only the warehouse name',
        value: {
          name: 'Buea Central Warehouse - Expanded',
        },
      },
      capacityUpdate: {
        summary: 'Update warehouse capacity',
        description: 'Example of updating only the warehouse capacity',
        value: {
          capacity: 15000,
        },
      },
      fullUpdate: {
        summary: 'Update multiple fields',
        description: 'Example of updating multiple warehouse fields',
        value: {
          name: 'Buea Central Warehouse - Renovated',
          latitude: 4.154,
          longitude: 9.2875,
          capacity: 20000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse updated successfully',
    type: WarehouseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation errors',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
    type: ErrorResponseDto,
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
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return await this.warehouseService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a warehouse',
    description:
      'Permanently deletes a warehouse. Cannot delete warehouses that still contain inventory items. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'Warehouse unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse deleted successfully',
    type: WarehouseDeleteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete warehouse with existing inventory',
    type: ErrorResponseDto,
    examples: {
      hasInventory: {
        summary: 'Error when trying to delete warehouse with inventory',
        value: {
          success: false,
          message:
            'Cannot delete warehouse that still contains inventory items. Please move or remove all inventory first.',
          errors: [],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Warehouse not found',
    type: ErrorResponseDto,
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
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.warehouseService.remove(id);
  }
}
