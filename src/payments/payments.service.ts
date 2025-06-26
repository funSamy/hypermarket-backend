import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  GatewayTimeoutException,
} from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FapshiService } from './services/fapshi.service';
import { OrdersService } from '../orders/orders.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private fapshiService: FapshiService,
    private ordersService: OrdersService,
    // private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  async initiatePayment(
    userId: string,
    initiatePaymentDto: InitiatePaymentDto,
  ) {
    const { orderId, method, phoneNumber, deliveryAddress, description } =
      initiatePaymentDto;

    // Verify that the order exists and belongs to the user
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: OrderStatus.PENDING_PAYMENT,
      },
      include: {
        payment: true,
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

    if (!order) {
      throw new NotFoundException(
        'Order not found or not eligible for payment',
      );
    }

    const orderPayment = order.payment;

    // Check if payment already exists and is not failed
    if (orderPayment && orderPayment.status !== PaymentStatus.FAILED) {
      throw new BadRequestException('Payment already exists for this order');
    }

    let paymentTransaction: string;
    let paymentResponse: { transactionId: string; paymentUrl?: string } | null =
      null;

    if (method === PaymentMethod.MOMO) {
      if (!phoneNumber) {
        throw new BadRequestException(
          'Phone number is required for mobile money payment',
        );
      }

      // Check if FAPSHI is configured
      if (!this.fapshiService.isConfigured()) {
        throw new GatewayTimeoutException(
          'Mobile money payment is not available at the moment',
        );
      }

      try {
        // Initiate payment with FAPSHI
        paymentResponse = await this.fapshiService.initiatePayment({
          amount: order.totalAmount,
          phoneNumber,
          orderId: order.id,
          description: description || `Payment for order ${order.id}`,
        });

        paymentTransaction = paymentResponse.transactionId;
      } catch (error) {
        this.logger.error('Failed to initiate FAPSHI payment:', error);
        throw new BadRequestException(
          'Failed to initiate mobile money payment',
        );
      }
    } else if (method === PaymentMethod.COD) {
      // For Cash on Delivery, generate a unique transaction ID
      paymentTransaction = `COD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else {
      throw new BadRequestException('Unsupported payment method');
    }

    // Create or update payment record
    const paymentData = {
      method,
      status:
        method === PaymentMethod.COD
          ? PaymentStatus.PENDING
          : PaymentStatus.PENDING,
      transaction: paymentTransaction,
      orderId: order.id,
    };

    const payment = order.payment
      ? await this.prisma.payment.update({
          where: { id: order.payment.id },
          data: paymentData,
        })
      : await this.prisma.payment.create({
          data: paymentData,
        });

    // Prepare response based on payment method
    if (method === PaymentMethod.MOMO) {
      return {
        success: true,
        message: 'Mobile money payment initiated successfully',
        data: {
          payment: {
            id: payment.id,
            method: payment.method,
            status: payment.status,
            transaction: payment.transaction,
          },
          order: {
            id: order.id,
            totalAmount: order.totalAmount,
          },
          paymentUrl: paymentResponse?.paymentUrl,
          instructions: 'Please complete the payment on your mobile device',
        },
      };
    } else {
      // Cash on Delivery
      return {
        success: true,
        message: 'Cash on Delivery payment initiated successfully',
        data: {
          payment: {
            id: payment.id,
            method: payment.method,
            status: payment.status,
            transaction: payment.transaction,
          },
          order: {
            id: order.id,
            totalAmount: order.totalAmount,
          },
          deliveryInfo: {
            address: deliveryAddress,
            instructions: 'Please have the exact amount ready for delivery',
            estimatedDelivery: '2-3 business days',
          },
        },
      };
    }
  }

  async handleWebhook(payload: WebhookPayloadDto, signature?: string) {
    this.logger.log('Received payment webhook');

    // Validate signature if provided (for FAPSHI)
    if (signature) {
      const isValidSignature = this.fapshiService.validateWebhookSignature(
        payload as unknown as Record<string, unknown>,
        signature,
      );

      if (!isValidSignature) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    }

    // Find the payment record
    const payment = await this.prisma.payment.findUnique({
      where: { transaction: payload.transaction },
      include: {
        order: true,
      },
    });

    if (!payment) {
      this.logger.error(
        `Payment not found for transaction: ${payload.transaction}`,
      );
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: payload.status,
        paidAt: payload.paidAt
          ? new Date(payload.paidAt)
          : payload.status === PaymentStatus.SUCCEEDED
            ? new Date()
            : null,
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Send payment notification email (don't await to avoid blocking)
    this.notificationsService
      .sendPaymentNotification({
        userEmail: updatedPayment.order.user.email,
        userName: updatedPayment.order.user.name,
        orderId: updatedPayment.order.id,
        paymentStatus: updatedPayment.status,
        totalAmount: updatedPayment.order.totalAmount,
        paymentMethod:
          updatedPayment.method === PaymentMethod.MOMO
            ? 'Mobile Money'
            : 'Cash on Delivery',
        transactionId: updatedPayment.transaction,
      })
      .catch((error) => {
        console.error('Failed to send payment notification:', error);
      });

    // Update order status based on payment status
    if (payload.status === PaymentStatus.SUCCEEDED) {
      // Move order to PROCESSING status and reserve inventory
      await this.ordersService.updateStatus(payment.orderId, {
        status: OrderStatus.PROCESSING,
      });

      this.logger.log(`Payment succeeded for order ${payment.orderId}`);
    } else if (payload.status === PaymentStatus.FAILED) {
      // Mark order as failed
      await this.ordersService.updateStatus(payment.orderId, {
        status: OrderStatus.FAILED,
      });

      this.logger.log(`Payment failed for order ${payment.orderId}`);
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
      data: {
        payment: updatedPayment,
        status: payload.status,
      },
    };
  }

  async getPaymentHistory(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderDate: true,
            totalAmount: true,
            status: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        order: {
          orderDate: 'desc',
        },
      },
    });

    return {
      success: true,
      message: 'Payment history retrieved successfully',
      data: payments,
    };
  }

  async getPaymentById(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          userId,
        },
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    image: true,
                    price: true,
                  },
                },
              },
            },
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      message: 'Payment details retrieved successfully',
      data: payment,
    };
  }

  async verifyPaymentStatus(transactionId: string, userId: string) {
    // Find payment by transaction ID and user
    const payment = await this.prisma.payment.findFirst({
      where: {
        transaction: transactionId,
        order: {
          userId,
        },
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    let verificationResult: {
      status: PaymentStatus;
      paidAt?: string | Date;
    } | null = null;

    // For mobile money payments, verify with FAPSHI
    if (
      payment.method === PaymentMethod.MOMO &&
      this.fapshiService.isConfigured()
    ) {
      try {
        const fapshiResult =
          await this.fapshiService.verifyPayment(transactionId);

        // Map FAPSHI status to PaymentStatus
        let mappedStatus: PaymentStatus;
        switch (fapshiResult.status) {
          case 'SUCCESSFUL':
            mappedStatus = PaymentStatus.SUCCEEDED;
            break;
          case 'FAILED':
            mappedStatus = PaymentStatus.FAILED;
            break;
          case 'PENDING':
          case 'CREATED':
            mappedStatus = PaymentStatus.PENDING;
            break;
          case 'EXPIRED':
            mappedStatus = PaymentStatus.FAILED;
            break;
          default:
            mappedStatus = PaymentStatus.PENDING;
        }

        verificationResult = {
          status: mappedStatus,
          paidAt: fapshiResult.status === 'SUCCESSFUL' ? new Date() : undefined,
        };

        // Update payment status if different from current
        if (
          verificationResult &&
          verificationResult.status !== payment.status
        ) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: verificationResult.status,
              paidAt: verificationResult.paidAt
                ? new Date(verificationResult.paidAt)
                : null,
            },
          });
        }
      } catch (error) {
        this.logger.error('Failed to verify payment with FAPSHI:', error);
      }
    }

    return {
      success: true,
      message: 'Payment status verified',
      data: {
        payment: {
          id: payment.id,
          status: verificationResult?.status || payment.status,
          method: payment.method,
          transaction: payment.transaction,
          paidAt: payment.paidAt,
        },
        order: {
          id: payment.order.id,
          status: payment.order.status,
          totalAmount: payment.order.totalAmount,
        },
        verification: verificationResult,
      },
    };
  }

  getSupportedProviders() {
    const providers = this.fapshiService.getSupportedProviders();

    return {
      success: true,
      message: 'Supported payment providers retrieved successfully',
      data: {
        mobileMoneyProviders: providers,
        paymentMethods: [
          {
            code: PaymentMethod.MOMO,
            name: 'Mobile Money',
            description:
              'Pay using MTN Mobile Money, Orange Money, or Express Union Mobile',
            isAvailable: this.fapshiService.isConfigured(),
          },
          {
            code: PaymentMethod.COD,
            name: 'Cash on Delivery',
            description: 'Pay with cash when your order is delivered',
            isAvailable: true,
          },
        ],
      },
    };
  }
}
