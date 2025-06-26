import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { name, email, password, phone } = registerUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    // Send welcome email (don't await to avoid blocking registration)
    this.notificationsService
      .sendWelcomeEmail({
        userEmail: user.email,
        userName: user.name,
      })
      .catch((error) => {
        console.error('Failed to send welcome email:', error);
      });

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Token expires in 1 hour
      algorithm: 'HS512', // Use HS512 algorithm for signing
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresIn = 15; // OTP expires in 15 minutes

    // Save OTP to database
    await this.prisma.passwordResetToken.create({
      data: {
        token: otp,
        userId: user.id,
        expiresAt: new Date(Date.now() + expiresIn * 60000),
      },
    });

    // Send OTP to user's email
    await this.notificationsService.sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.name,
      otpCode: otp,
      expiresIn,
    });

    return {
      success: true,
      message: 'Password reset OTP sent to your email',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    // Find OTP in database
    const tokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: otp,
        user: {
          email,
        },
        expiresAt: {
          gt: new Date(), // Ensure OTP has not expired
        },
        used: false, // Ensure OTP has not been used
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // use transaction to ensure atomicity
    await this.prisma.$transaction(async (prisma) => {
      // Update user password
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      // Mark OTP as used
      await prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });
    });

    return {
      success: true,
      message: 'Password reset successful',
    };
  }
}
