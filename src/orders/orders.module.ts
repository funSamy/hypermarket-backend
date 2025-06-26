import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { FulfillmentService } from './services/fulfillment.service';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, FulfillmentService, PrismaService],
  exports: [OrdersService, FulfillmentService],
})
export class OrdersModule {}
