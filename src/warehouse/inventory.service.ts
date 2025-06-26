import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventoryForWarehouse(
    warehouseId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Verify warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    const skip = (page - 1) * limit;

    const [inventories, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { warehouseId },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          warehouse: true,
        },
        skip,
        take: limit,
        orderBy: { product: { name: 'asc' } },
      }),
      this.prisma.inventory.count({
        where: { warehouseId },
      }),
    ]);

    return {
      data: inventories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustInventory(dto: AdjustInventoryDto): Promise<any> {
    // Verify warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${dto.warehouseId} not found`,
      );
    }

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Check if inventory record exists
    const existingInventory = await this.prisma.inventory.findFirst({
      where: {
        warehouseId: dto.warehouseId,
        productId: dto.productId,
      },
    });

    let inventory;

    if (existingInventory) {
      // Update existing inventory
      inventory = await this.prisma.inventory.update({
        where: { id: existingInventory.id },
        data: { quantity: dto.quantity },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          warehouse: true,
        },
      });
    } else {
      // Create new inventory record
      inventory = await this.prisma.inventory.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          quantity: dto.quantity,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          warehouse: true,
        },
      });
    }

    return inventory;
  }

  async getTotalInventoryForProduct(productId: string) {
    const result = await this.prisma.inventory.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }
}
