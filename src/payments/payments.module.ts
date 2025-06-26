import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { FapshiService } from './services/fapshi.service';
import { PrismaService } from '../common/services/prisma.service';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [OrdersModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, FapshiService, PrismaService],
  exports: [PaymentsService, FapshiService],
})
export class PaymentsModule {}
