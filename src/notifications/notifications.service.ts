import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface OrderNotificationData {
  userEmail: string;
  userName: string;
  orderId: string;
  orderStatus: string;
  totalAmount: number;
  orderItems: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

export interface PaymentNotificationData {
  userEmail: string;
  userName: string;
  orderId: string;
  paymentStatus: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId: string;
}

export interface WelcomeEmailData {
  userEmail: string;
  userName: string;
}

export interface PasswordResetEmailData {
  userEmail: string;
  userName: string;
  otpCode: string;
  expiresIn: number; // minutes
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'Hypermarket <noreply@hypermarket.com>';
    this.isEnabled =
      !!apiKey && this.configService.get<string>('NODE_ENV') !== 'test';

    if (this.isEnabled) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      this.logger.warn(
        'Email service disabled - RESEND_API_KEY not configured or running in test mode',
      );
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.debug('Email sending disabled, skipping email send');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        tags: emailData.tags,
      });

      if (error) {
        this.logger.error('Failed to send email:', error);
        return false;
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = this.generateWelcomeEmailTemplate(data);

    return this.sendEmail({
      to: data.userEmail,
      subject: 'Welcome to Hypermarket! 🎉',
      html,
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'user_id', value: data.userName },
      ],
    });
  }

  /**
   * Send order status update notifications
   */
  async sendOrderStatusNotification(
    data: OrderNotificationData,
  ): Promise<boolean> {
    const html = this.generateOrderStatusEmailTemplate(data);
    const subject = this.getOrderStatusSubject(data.orderStatus, data.orderId);

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      tags: [
        { name: 'type', value: 'order_status' },
        { name: 'order_id', value: data.orderId },
        { name: 'status', value: data.orderStatus },
      ],
    });
  }

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const html = this.generatePasswordResetEmailTemplate(data);

    return this.sendEmail({
      to: data.userEmail,
      subject: '🔒 Password Reset - Hypermarket',
      html,
      tags: [
        { name: 'type', value: 'password_reset' },
        { name: 'user_email', value: data.userEmail },
      ],
    });
  }

  /**
   * Send payment status notifications
   */
  async sendPaymentNotification(
    data: PaymentNotificationData,
  ): Promise<boolean> {
    const html = this.generatePaymentNotificationTemplate(data);
    const subject = this.getPaymentStatusSubject(
      data.paymentStatus,
      data.orderId,
    );

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      tags: [
        { name: 'type', value: 'payment_status' },
        { name: 'order_id', value: data.orderId },
        { name: 'payment_status', value: data.paymentStatus },
        { name: 'payment_method', value: data.paymentMethod },
      ],
    });
  }

  /**
   * Generate welcome email HTML template
   */
  private generateWelcomeEmailTemplate(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Hypermarket</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .highlight { background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Welcome to Hypermarket!</h1>
        <p>Your ultimate shopping destination</p>
    </div>
    
    <div class="content">
        <h2>Hello ${data.userName}!</h2>
        
        <p>We're thrilled to have you join the Hypermarket family! Your account has been successfully created and you're now ready to explore thousands of amazing products.</p>
        
        <div class="highlight">
            <h3>🛍️ What's Next?</h3>
            <ul>
                <li>Browse our extensive product catalog</li>
                <li>Add items to your wishlist</li>
                <li>Enjoy fast and secure checkout</li>
                <li>Track your orders in real-time</li>
            </ul>
        </div>
        
        <p>Need help getting started? Our customer support team is here to assist you every step of the way.</p>
        
        <p>Happy shopping!</p>
        <p><strong>The Hypermarket Team</strong></p>
    </div>
    
    <div class="footer">
        <p>© 2025 Hypermarket. All rights reserved.</p>
        <p>If you have any questions, reply to this email or contact our support team.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate order status email HTML template
   */
  private generateOrderStatusEmailTemplate(
    data: OrderNotificationData,
  ): string {
    const statusEmoji = this.getStatusEmoji(data.orderStatus);
    const statusMessage = this.getStatusMessage(data.orderStatus);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Update - ${data.orderId}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
        .order-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
        .status-processing { background: #ffeaa7; color: #d63031; }
        .status-shipped { background: #74b9ff; color: white; }
        .status-delivered { background: #00b894; color: white; }
        .status-cancelled { background: #fd79a8; color: white; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background: #f8f9fa; }
        .total { font-size: 18px; font-weight: bold; color: #667eea; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${statusEmoji} Order Update</h1>
        <p>Order #${data.orderId}</p>
    </div>
    
    <div class="content">
        <h2>Hello ${data.userName}!</h2>
        
        <p>${statusMessage}</p>
        
        <div class="order-info">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${data.orderStatus.toLowerCase()}">${data.orderStatus}</span></p>
            ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
            ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
        </div>
        
        <h3>Order Items</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${data.orderItems
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.productName}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.unitPrice.toFixed(2)}</td>
                        <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                `,
                  )
                  .join('')}
            </tbody>
        </table>
        
        <div class="total">
            <p>Total Amount: $${data.totalAmount.toFixed(2)}</p>
        </div>
        
        <p>Thank you for choosing Hypermarket!</p>
        <p><strong>The Hypermarket Team</strong></p>
    </div>
    
    <div class="footer">
        <p>© 2025 Hypermarket. All rights reserved.</p>
        <p>Questions? Contact our support team or check your order status online.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate password reset email HTML template
   */
  private generatePasswordResetEmailTemplate(
    data: PasswordResetEmailData,
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Hypermarket</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
        .otp-box { background: #f8f9fa; padding: 25px; text-align: center; border: 2px dashed #667eea; border-radius: 8px; margin: 25px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .security-tips { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Password Reset Request</h1>
        <p>Secure access to your Hypermarket account</p>
    </div>
    
    <div class="content">
        <h2>Hello ${data.userName}!</h2>
        
        <p>We received a request to reset your password for your Hypermarket account. If you made this request, please use the verification code below to reset your password.</p>
        
        <div class="otp-box">
            <h3>Your Verification Code</h3>
            <div class="otp-code">${data.otpCode}</div>
            <p><strong>This code expires in ${data.expiresIn} minutes</strong></p>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This code is for one-time use only. Do not share this code with anyone. If you didn't request a password reset, please ignore this email and your account will remain secure.
        </div>
        
        <div class="security-tips">
            <h4>🛡️ Security Tips:</h4>
            <ul>
                <li>Never share your verification codes with anyone</li>
                <li>Use a strong, unique password for your account</li>
                <li>Enable two-factor authentication when available</li>
                <li>Contact support if you notice any suspicious activity</li>
            </ul>
        </div>
        
        <p>If you didn't request this password reset, you can safely ignore this email. Your account password will not be changed.</p>
        
        <p>Need help? Contact our support team - we're here to help!</p>
        
        <p><strong>The Hypermarket Security Team</strong></p>
    </div>
    
    <div class="footer">
        <p>© 2025 Hypermarket. All rights reserved.</p>
        <p>This is an automated security message. Please do not reply to this email.</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate payment notification email HTML template
   */
  private generatePaymentNotificationTemplate(
    data: PaymentNotificationData,
  ): string {
    const statusEmoji =
      data.paymentStatus === 'SUCCEEDED'
        ? '✅'
        : data.paymentStatus === 'FAILED'
          ? '❌'
          : '⏳';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment ${data.paymentStatus} - Order ${data.orderId}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
        .payment-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .status-success { color: #00b894; }
        .status-failed { color: #d63031; }
        .status-pending { color: #fdcb6e; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${statusEmoji} Payment ${data.paymentStatus}</h1>
        <p>Order #${data.orderId}</p>
    </div>
    
    <div class="content">
        <h2>Hello ${data.userName}!</h2>
        
        ${
          data.paymentStatus === 'SUCCEEDED'
            ? '<p>Great news! Your payment has been successfully processed.</p>'
            : data.paymentStatus === 'FAILED'
              ? '<p>We were unable to process your payment. Please try again or contact support for assistance.</p>'
              : "<p>Your payment is being processed. We'll notify you once it's complete.</p>"
        }
        
        <div class="payment-info">
            <h3>Payment Details</h3>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Payment Status:</strong> <span class="status-${data.paymentStatus.toLowerCase()}">${data.paymentStatus}</span></p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p><strong>Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
        </div>
        
        ${
          data.paymentStatus === 'SUCCEEDED'
            ? "<p>Your order is now being processed and will be shipped soon. You'll receive another notification with tracking information.</p>"
            : data.paymentStatus === 'FAILED'
              ? '<p>If you continue to experience issues, please contact our customer support team for assistance.</p>'
              : "<p>Please allow a few minutes for the payment to be processed. You'll receive a confirmation email once completed.</p>"
        }
        
        <p>Thank you for choosing Hypermarket!</p>
        <p><strong>The Hypermarket Team</strong></p>
    </div>
    
    <div class="footer">
        <p>© 2025 Hypermarket. All rights reserved.</p>
        <p>Questions about your payment? Contact our support team.</p>
    </div>
</body>
</html>
    `;
  }

  private getOrderStatusSubject(status: string, orderId: string): string {
    const subjects: Record<string, string> = {
      PENDING_PAYMENT: `Payment Required - Order #${orderId}`,
      PROCESSING: `Order Confirmed - Order #${orderId}`,
      SHIPPED: `Your Order is on the Way - Order #${orderId}`,
      DELIVERED: `Order Delivered - Order #${orderId}`,
      CANCELLED: `Order Cancelled - Order #${orderId}`,
      FAILED: `Order Failed - Order #${orderId}`,
    };

    return subjects[status] || `Order Update - Order #${orderId}`;
  }

  private getPaymentStatusSubject(status: string, orderId: string): string {
    const subjects: Record<string, string> = {
      SUCCEEDED: `Payment Confirmed - Order #${orderId}`,
      FAILED: `Payment Failed - Order #${orderId}`,
      PENDING: `Payment Processing - Order #${orderId}`,
    };

    return subjects[status] || `Payment Update - Order #${orderId}`;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      PENDING_PAYMENT: '💳',
      PROCESSING: '📦',
      SHIPPED: '🚚',
      DELIVERED: '✅',
      CANCELLED: '❌',
      FAILED: '⚠️',
    };

    return emojis[status] || '📋';
  }

  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      PENDING_PAYMENT: 'Your order is waiting for payment confirmation.',
      PROCESSING:
        'Great news! Your order has been confirmed and is being prepared for shipment.',
      SHIPPED:
        'Your order is on its way! You can track your package using the information below.',
      DELIVERED:
        'Your order has been successfully delivered. We hope you enjoy your purchase!',
      CANCELLED: 'Your order has been cancelled as requested.',
      FAILED:
        'Unfortunately, there was an issue with your order. Our team has been notified.',
    };

    return messages[status] || 'Your order status has been updated.';
  }
}
