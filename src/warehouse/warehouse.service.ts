import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWarehouseDto) {
    return await this.prisma.warehouse.create({
      data: {
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        capacity: dto.capacity,
      },
      include: {
        inventories: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAll() {
    return await this.prisma.warehouse.findMany({
      include: {
        inventories: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventories: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    // Check if warehouse exists
    await this.findOne(id);

    return await this.prisma.warehouse.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      },
      include: {
        inventories: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Check if warehouse exists
    const warehouse = await this.findOne(id);

    // Safety check: prevent deletion if warehouse has inventory
    if (warehouse.inventories.length > 0) {
      throw new BadRequestException(
        'Cannot delete warehouse that still contains inventory items. Please move or remove all inventory first.',
      );
    }

    await this.prisma.warehouse.delete({
      where: { id },
    });

    return { message: 'Warehouse deleted successfully' };
  }
}
