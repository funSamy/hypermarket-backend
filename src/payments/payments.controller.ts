import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentHistoryResponseDto } from './dto/payment-history-response.dto';
import { PaymentProvidersResponseDto } from './dto/payment-providers-response.dto';
import { PaymentVerificationResponseDto } from './dto/payment-verification-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { User as AppUser } from '@prisma/client';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

type PrismaUser = Omit<AppUser, 'passwordHash'>;

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Initiate payment',
    description:
      'Initiates a payment for an order using the specified payment method.',
  })
  @ApiBody({
    type: InitiatePaymentDto,
    description: 'Payment initiation data',
    examples: {
      mobileMoneyExample: {
        summary: 'Mobile Money Payment',
        description: 'Example of initiating mobile money payment',
        value: {
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          method: 'MOMO',
          phoneNumber: '+237650000000',
          description: 'Payment for order #12345',
        },
      },
      codExample: {
        summary: 'Cash on Delivery',
        description: 'Example of cash on delivery payment',
        value: {
          orderId: '550e8400-e29b-41d4-a716-446655440000',
          method: 'COD',
          deliveryAddress: '123 Main St, City, State 12345',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment data or order not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  initiatePayment(
    @User() user: PrismaUser,
    @Body() initiatePaymentDto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(user.id, initiatePaymentDto);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Payment webhook',
    description: 'Receives payment status updates from payment providers.',
  })
  @ApiHeader({
    name: 'x-fapshi-signature',
    description: 'HMAC signature for webhook verification',
    required: false,
  })
  @ApiBody({
    type: WebhookPayloadDto,
    description: 'Payment webhook payload',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid webhook payload or signature',
    type: ErrorResponseDto,
  })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-fapshi-signature') signature?: string,
  ) {
    this.logger.log('Received payment webhook');

    // Log webhook details for debugging (be careful with sensitive data)
    this.logger.debug('Webhook payload received:', {
      transaction: payload.transaction,
      status: payload.status,
      orderId: payload.orderId,
    });

    try {
      return await this.paymentsService.handleWebhook(payload, signature);
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get payment history',
    description: 'Retrieves the payment history for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
    type: PaymentHistoryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  getPaymentHistory(@User() user: PrismaUser) {
    return this.paymentsService.getPaymentHistory(user.id);
  }

  @Get('providers')
  @ApiOperation({
    summary: 'Get supported payment providers',
    description: 'Retrieves a list of supported payment methods and providers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment providers retrieved successfully',
    type: PaymentProvidersResponseDto,
  })
  getSupportedProviders() {
    return this.paymentsService.getSupportedProviders();
  }

  @Get('verify/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verify payment status',
    description: 'Verifies the current status of a payment by transaction ID.',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'Payment transaction identifier',
    example: 'TXN_1234567890',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status verified successfully',
    type: PaymentVerificationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Payment not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  verifyPaymentStatus(
    @Param('transactionId') transactionId: string,
    @User() user: PrismaUser,
  ) {
    return this.paymentsService.verifyPaymentStatus(transactionId, user.id);
  }

  @Get(':paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieves a specific payment by its unique identifier.',
  })
  @ApiParam({
    name: 'paymentId',
    description: 'Payment unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Payment not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  getPaymentById(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @User() user: PrismaUser,
  ) {
    return this.paymentsService.getPaymentById(paymentId, user.id);
  }
}
