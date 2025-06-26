import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { WarehouseController } from './warehouse.controller';
import { InventoryController } from './inventory.controller';
import { WarehouseService } from './warehouse.service';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [WarehouseController, InventoryController],
  providers: [WarehouseService, InventoryService, PrismaService],
  exports: [WarehouseService, InventoryService],
})
export class WarehouseModule {}
