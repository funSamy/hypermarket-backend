import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as crypto from 'crypto';

// FAPSHI API Types based on official documentation
export interface GenerateLinkRequest {
  amount: number;
  email?: string;
  redirectUrl?: string;
  userId?: string;
  externalId?: string;
  message?: string;
  cardOnly?: boolean;
}

export interface GenerateLinkResponse {
  link: string;
  transId: string;
  message?: string;
}

export interface PaymentStatusResponse {
  transId: string;
  status: 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED';
}

export interface ExpirePaymentResponse {
  transId: string;
  status: 'EXPIRED';
}

export interface DirectPaymentRequest {
  amount: number;
  phone: string;
  medium?: 'mobile money' | 'orange money';
  name?: string;
  email?: string;
  userId?: string;
  externalId?: string;
  message?: string;
}

export interface DirectPaymentResponse {
  transId: string;
}

interface FapshiPaymentRequest {
  amount: number;
  phoneNumber: string;
  orderId: string;
  description?: string;
  redirectUrl?: string;
}

interface FapshiPaymentResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  status: string;
  message: string;
  paymentUrl?: string;
}

interface FapshiErrorResponse {
  message: string;
}

interface FapshiWebhookPayload {
  transId: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'EXPIRED';
  externalId: string;
  amount: number;
}

@Injectable()
export class FapshiService {
  private readonly logger = new Logger(FapshiService.name);
  private readonly apiClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly merchantId: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FAPSHI_API_KEY') || '';
    this.merchantId = this.configService.get<string>('FAPSHI_API_USER') || '';

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    this.baseUrl = isProduction
      ? this.configService.get<string>('FAPSHI_LIVE_BASE_URL') ||
        'https://api.fapshi.com'
      : this.configService.get<string>('FAPSHI_SANDBOX_BASE_URL') ||
        'https://sandbox.fapshi.com';

    this.webhookSecret =
      this.configService.get<string>('FAPSHI_WEBHOOK_SECRET') || '';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        apiuser: this.merchantId,
        apikey: this.apiKey,
      },
    });

    this.apiClient.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Making request to: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error: AxiosError) => {
        this.logger.error('Request interceptor error:', error.message);
        return Promise.reject(error);
      },
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Response received: ${response.status} from ${response.config.url}`,
        );
        return response;
      },
      (error: AxiosError<FapshiErrorResponse>) => {
        this.logger.error(
          'Response interceptor error:',
          error.response?.data?.message || error.message,
        );
        return Promise.reject(error);
      },
    );
  }

  async generateLink(
    request: GenerateLinkRequest,
  ): Promise<GenerateLinkResponse> {
    try {
      this.logger.log(`Generating payment link for amount ${request.amount}`);

      const response = await this.apiClient.post<GenerateLinkResponse>(
        '/initiate-pay',
        request,
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<FapshiErrorResponse>;
      this.logger.error('Error generating payment link:', axiosError.message);
      throw new BadRequestException(
        axiosError.response?.data?.message ||
          'An unexpected error occurred while generating the payment link.',
      );
    }
  }

  async initiateDirectPayment(
    request: DirectPaymentRequest,
  ): Promise<DirectPaymentResponse> {
    try {
      this.logger.log(
        `Initiating direct payment for ${request.amount} to ${request.phone}`,
      );

      const response = await this.apiClient.post<DirectPaymentResponse>(
        '/direct-pay',
        request,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<FapshiErrorResponse>;
      this.logger.error('Error initiating direct payment:', axiosError.message);
      throw new BadRequestException(
        axiosError.response?.data?.message ||
          'An unexpected error occurred during direct payment.',
      );
    }
  }

  async initiatePayment(
    paymentRequest: FapshiPaymentRequest,
  ): Promise<FapshiPaymentResponse> {
    this.logger.warn(
      'DEPRECATED: `initiatePayment` is deprecated. Use `generateLink` or `initiateDirectPayment` instead.',
    );

    if (!this.isValidCameroonPhoneNumber(paymentRequest.phoneNumber)) {
      throw new BadRequestException('Invalid Cameroon phone number.');
    }

    const formattedPhoneNumber = this.formatPhoneNumber(
      paymentRequest.phoneNumber,
    );

    const directPaymentRequest: DirectPaymentRequest = {
      amount: paymentRequest.amount,
      phone: formattedPhoneNumber,
      externalId: paymentRequest.orderId,
      message: paymentRequest.description,
    };

    const directPaymentResponse =
      await this.initiateDirectPayment(directPaymentRequest);

    return {
      success: true,
      transactionId: directPaymentResponse.transId,
      reference: paymentRequest.orderId,
      status: 'PENDING',
      message: 'Payment initiated successfully.',
    };
  }

  async getPaymentStatus(transId: string): Promise<PaymentStatusResponse> {
    try {
      this.logger.log(`Fetching payment status for transaction ${transId}`);

      const response = await this.apiClient.get<PaymentStatusResponse>(
        `/payment-status/${transId}`,
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<FapshiErrorResponse>;
      this.logger.error('Error fetching payment status:', axiosError.message);
      throw new BadRequestException(
        axiosError.response?.data?.message ||
          'An unexpected error occurred while fetching payment status.',
      );
    }
  }

  async expirePayment(transId: string): Promise<ExpirePaymentResponse> {
    try {
      this.logger.log(`Expiring payment for transaction ${transId}`);

      const response = await this.apiClient.post<ExpirePaymentResponse>(
        '/expire-pay',
        { transId },
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<FapshiErrorResponse>;
      this.logger.error('Error expiring payment:', axiosError.message);
      throw new BadRequestException(
        axiosError.response?.data?.message ||
          'An unexpected error occurred while expiring the payment.',
      );
    }
  }

  async verifyPayment(transactionId: string) {
    this.logger.warn(
      'DEPRECATED: `verifyPayment` is deprecated. Use `getPaymentStatus` instead.',
    );
    const statusResponse = await this.getPaymentStatus(transactionId);
    return {
      success: statusResponse.status === 'SUCCESSFUL',
      status: statusResponse.status,
      transId: statusResponse.transId,
    };
  }

  validateWebhookSignature(
    payload: Record<string, unknown>,
    signature: string,
  ): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Error validating webhook signature:', error);
      return false;
    }
  }

  private generateSignature(payload: Record<string, unknown>): string {
    const sortedKeys = Object.keys(payload).sort();
    const queryString = sortedKeys
      .map((key) => `${key}=${String(payload[key])}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(queryString)
      .digest('hex');
  }

  private isValidCameroonPhoneNumber(phoneNumber: string): boolean {
    const cameroonPattern = /^(\+237)?[26][0-9]{8}$/;
    return cameroonPattern.test(phoneNumber.replace(/\s/g, ''));
  }

  private formatPhoneNumber(phoneNumber: string): string {
    let formatted = phoneNumber.replace(/[\s-()]/g, '');

    if (formatted.startsWith('6') || formatted.startsWith('2')) {
      formatted = '+237' + formatted;
    } else if (formatted.startsWith('237')) {
      formatted = '+' + formatted;
    }

    return formatted;
  }

  getSupportedProviders() {
    return [
      {
        name: 'MTN Mobile Money',
        code: 'MTN_MOMO',
        prefix: ['650', '651', '652', '653', '654'],
      },
      {
        name: 'Orange Money',
        code: 'ORANGE_MONEY',
        prefix: ['655', '656', '657', '658', '659'],
      },
      {
        name: 'Express Union Mobile',
        code: 'EU_MOBILE',
        prefix: ['690', '691', '692', '693', '694'],
      },
    ];
  }

  handleWebhook(payload: FapshiWebhookPayload): void {
    try {
      if (!payload.transId || !payload.status || !payload.externalId) {
        throw new BadRequestException(
          'Invalid webhook payload: missing required fields',
        );
      }

      this.logger.log(
        `Processing webhook for FAPSHI transaction ${payload.transId} (External ID: ${payload.externalId}), Status: ${payload.status}`,
      );

      this.logger.debug('Webhook payload:', {
        transId: payload.transId,
        status: payload.status,
        externalId: payload.externalId,
        amount: payload.amount,
      });
    } catch (error) {
      this.logger.error('Error processing FAPSHI webhook:', error);
      throw new BadRequestException('Error processing FAPSHI webhook');
    }
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.merchantId);
  }
}
