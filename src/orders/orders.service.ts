import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FulfillmentService } from './services/fulfillment.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, Role, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private fulfillmentService: FulfillmentService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items, deliveryAddress, deliveryLatitude, deliveryLongitude } =
      createOrderDto;

    // Validate that all products exist
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        inventories: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Calculate fulfillment strategy
    const fulfillmentResult =
      await this.fulfillmentService.calculateFulfillmentStrategy(
        items,
        deliveryLatitude,
        deliveryLongitude,
      );

    if (!fulfillmentResult.canFulfill) {
      return {
        success: false,
        message: 'Cannot fulfill order due to insufficient stock',
        data: {
          fulfillmentResult,
          canProceed: false,
        },
      };
    }

    // Create the order in PENDING_PAYMENT status
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount: fulfillmentResult.totalCost,
          status: OrderStatus.PENDING_PAYMENT,
        },
      });

      // Create order items based on fulfillment plans
      for (const plan of fulfillmentResult.plans) {
        for (const item of plan.items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
          });
        }
      }

      return newOrder;
    });

    // Return order with fulfillment plan for user confirmation
    return {
      success: true,
      message: 'Order created successfully. Please proceed with payment.',
      data: {
        order: {
          id: order.id,
          totalAmount: order.totalAmount,
          status: order.status,
          orderDate: order.orderDate,
        },
        fulfillmentPlan: fulfillmentResult,
        estimatedDelivery: `${fulfillmentResult.estimatedDeliveryDays} day(s)`,
        deliveryInfo: {
          address: deliveryAddress,
          coordinates:
            deliveryLatitude && deliveryLongitude
              ? { lat: deliveryLatitude, lng: deliveryLongitude }
              : null,
        },
      },
    };
  }

  async findAll(userId: string, userRole: Role) {
    const whereClause: Prisma.OrderWhereInput =
      userRole === Role.ADMIN ? {} : { userId };

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            transaction: true,
            paidAt: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    // Calculate summary for each order
    const ordersWithSummary = orders.map((order) => ({
      ...order,
      itemCount: order.items.length,
      totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));

    return {
      success: true,
      message: 'Orders retrieved successfully',
      data: ordersWithSummary,
    };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user can access this order
    if (userRole !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('You can only access your own orders');
    }

    // Calculate order summary
    const orderSummary = {
      ...order,
      itemCount: order.items.length,
      totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: order.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ),
    };

    return {
      success: true,
      message: 'Order retrieved successfully',
      data: orderSummary,
    };
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const { status } = updateOrderStatusDto;

    // Check if order exists
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(
      existingOrder.status,
    );
    if (!validTransitions.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${existingOrder.status} to ${status}`,
      );
    }

    // Handle inventory reservation when order moves from PENDING_PAYMENT to PROCESSING
    if (
      existingOrder.status === OrderStatus.PENDING_PAYMENT &&
      status === OrderStatus.PROCESSING
    ) {
      // Re-calculate fulfillment to ensure inventory is still available
      const fulfillmentResult =
        await this.fulfillmentService.calculateFulfillmentStrategy(
          existingOrder.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        );

      if (!fulfillmentResult.canFulfill) {
        throw new BadRequestException(
          'Cannot process order due to insufficient inventory',
        );
      }

      // Reserve inventory
      const reservationSuccess = await this.fulfillmentService.reserveInventory(
        fulfillmentResult.plans,
      );

      if (!reservationSuccess) {
        throw new BadRequestException('Failed to reserve inventory for order');
      }
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Send order status notification email (don't await to avoid blocking)
    this.notificationsService
      .sendOrderStatusNotification({
        userEmail: updatedOrder.user.email,
        userName: updatedOrder.user.name,
        orderId: updatedOrder.id,
        orderStatus: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        orderItems: updatedOrder.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        estimatedDelivery:
          status === OrderStatus.SHIPPED ? '2-3 business days' : undefined,
        trackingNumber:
          status === OrderStatus.SHIPPED ? `TRK${Date.now()}` : undefined,
      })
      .catch((error) => {
        console.error('Failed to send order status notification:', error);
      });

    return {
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder,
    };
  }

  async getOrderStatistics(userId?: string) {
    const whereClause = userId ? { userId } : {};

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      canceledOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count({ where: whereClause }),
      this.prisma.order.count({
        where: { ...whereClause, status: OrderStatus.PENDING_PAYMENT },
      }),
      this.prisma.order.count({
        where: { ...whereClause, status: OrderStatus.PROCESSING },
      }),
      this.prisma.order.count({
        where: { ...whereClause, status: OrderStatus.SHIPPED },
      }),
      this.prisma.order.count({
        where: { ...whereClause, status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.count({
        where: { ...whereClause, status: OrderStatus.CANCELED },
      }),
      this.prisma.order.aggregate({
        where: {
          ...whereClause,
          status: {
            in: [
              OrderStatus.DELIVERED,
              OrderStatus.SHIPPED,
              OrderStatus.PROCESSING,
            ],
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      success: true,
      message: 'Order statistics retrieved successfully',
      data: {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          canceled: canceledOrders,
        },
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        averageOrderValue:
          totalOrders > 0
            ? (totalRevenue._sum.totalAmount || 0) / totalOrders
            : 0,
      },
    };
  }

  private getValidStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [
        OrderStatus.PROCESSING,
        OrderStatus.CANCELED,
        OrderStatus.FAILED,
      ],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
      [OrderStatus.DELIVERED]: [], // Final state
      [OrderStatus.CANCELED]: [], // Final state
      [OrderStatus.FAILED]: [
        OrderStatus.PENDING_PAYMENT, // Allow retry
        OrderStatus.CANCELED,
      ],
    };

    return transitions[currentStatus] || [];
  }
}
