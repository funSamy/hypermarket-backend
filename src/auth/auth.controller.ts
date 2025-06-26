import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with the provided information. The password is hashed before storage.',
  })
  @ApiBody({
    type: RegisterUserDto,
    description: 'User registration data',
    examples: {
      example1: {
        summary: 'Standard Registration',
        description: 'Example of a typical user registration',
        value: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'securePassword123',
          phone: '+1234567890',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
    example: {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Validation failed',
      errors: [
        {
          field: 'email',
          message: 'Email must be a valid email address',
        },
        {
          field: 'password',
          message: 'Password must be at least 6 characters long',
        },
      ],
    },
  })
  @ApiConflictResponse({
    description: 'User already exists',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'User with this email already exists',
      errors: [{ message: 'Conflict: Email already registered' }],
    },
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description:
      'Generates a password reset OTP and sends it to the user email.',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'Forgot password request data',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP successfully sent',
    example: {
      success: true,
      message: 'Password reset OTP sent to your email',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Invalid email format',
      errors: [
        {
          field: 'email',
          message: 'Email must be a valid email address',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Email not found',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Email not found',
      errors: [{ message: 'Unauthorized: Email not found' }],
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets the user password using the OTP.',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Reset password request data',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    example: {
      success: true,
      message: 'Password reset successful',
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Invalid OTP',
      errors: [
        {
          field: 'otp',
          message: 'OTP must be a 6-digit number',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired OTP',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Invalid or expired OTP',
      errors: [{ message: 'Unauthorized: Invalid or expired OTP' }],
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates a user with email and password, returns access token on success.',
  })
  @ApiBody({
    type: LoginUserDto,
    description: 'User login credentials',
    examples: {
      example1: {
        summary: 'Standard Login',
        description: 'Example of a typical user login',
        value: {
          email: 'john.doe@example.com',
          password: 'securePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: AuthResponseDto,
    example: {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Validation failed',
      errors: [
        {
          field: 'email',
          message: 'Email must be a valid email address',
        },
        {
          field: 'password',
          message: 'Password is required',
        },
      ],
    },
  })
  @ApiConflictResponse({
    description: 'User already exists',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'User with this email already exists',
      errors: [{ message: 'Conflict: Email already registered' }],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    type: ErrorResponseDto,
    example: {
      success: false,
      message: 'Invalid credentials',
      errors: [{ message: 'Email or password is incorrect' }],
    },
  })
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }
}
