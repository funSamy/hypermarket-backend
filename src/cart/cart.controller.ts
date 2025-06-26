import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { User as PrismaUser } from '@prisma/client';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

type AuthenticatedUser = Omit<PrismaUser, 'passwordHash'>;

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user cart',
    description: "Retrieves the current user's shopping cart with all items.",
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  getCart(@User() user: AuthenticatedUser) {
    return this.cartService.getCart(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add item to cart',
    description:
      "Adds a product to the user's shopping cart with specified quantity.",
  })
  @ApiBody({
    type: AddToCartDto,
    description: 'Product and quantity to add to cart',
    examples: {
      example1: {
        summary: 'Add iPhone to cart',
        description: 'Example of adding a product to cart',
        value: {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    type: CartItemResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or insufficient stock',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  addToCart(
    @User() user: AuthenticatedUser,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Patch(':cartItemId/quantity/:quantity')
  @ApiOperation({
    summary: 'Update cart item quantity',
    description: "Updates the quantity of a specific item in the user's cart.",
  })
  @ApiParam({
    name: 'cartItemId',
    description: 'Cart item unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiParam({
    name: 'quantity',
    description: 'New quantity for the cart item',
    example: 3,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item quantity updated successfully',
    type: CartItemResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid quantity or insufficient stock',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cart item not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  updateQuantity(
    @User() user: AuthenticatedUser,
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
    @Param('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.cartService.updateCartItemQuantity(
      user.id,
      cartItemId,
      quantity,
    );
  }

  @Delete(':cartItemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove item from cart',
    description: "Removes a specific item from the user's shopping cart.",
  })
  @ApiParam({
    name: 'cartItemId',
    description: 'Cart item unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Item removed from cart successfully',
  })
  @ApiNotFoundResponse({
    description: 'Cart item not found',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  removeFromCart(
    @User() user: AuthenticatedUser,
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
  ) {
    return this.cartService.removeFromCart(user.id, cartItemId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Clear cart',
    description: "Removes all items from the user's shopping cart.",
  })
  @ApiResponse({
    status: 204,
    description: 'Cart cleared successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  clearCart(@User() user: AuthenticatedUser) {
    return this.cartService.clearCart(user.id);
  }
}
