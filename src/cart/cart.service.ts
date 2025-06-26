import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            inventories: {
              select: {
                quantity: true,
                warehouse: {
                  select: {
                    name: true,
                    latitude: true,
                    longitude: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    // Calculate totals and check stock availability
    const cartWithDetails = cartItems.map((item) => {
      const totalStock = item.product.inventories.reduce(
        (sum, inv) => sum + inv.quantity,
        0,
      );
      const subtotal = item.quantity * item.product.price;
      const isAvailable = totalStock >= item.quantity;

      return {
        ...item,
        subtotal,
        product: {
          ...item.product,
          totalStock,
          isAvailable,
        },
      };
    });

    const totalItems = cartWithDetails.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalAmount = cartWithDetails.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const hasUnavailableItems = cartWithDetails.some(
      (item) => !item.product.isAvailable,
    );

    return {
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        items: cartWithDetails,
        summary: {
          totalItems,
          totalAmount,
          hasUnavailableItems,
          itemCount: cartWithDetails.length,
        },
      },
    };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventories: {
          select: {
            quantity: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check stock availability
    const totalStock = product.inventories.reduce(
      (sum, inv) => sum + inv.quantity,
      0,
    );

    if (totalStock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${totalStock}, Requested: ${quantity}`,
      );
    }

    // Check if item already exists in cart
    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
      },
    });

    let cartItem: Prisma.CartItemGetPayload<{
      include: {
        product: {
          select: {
            id: true;
            name: true;
            price: true;
          };
        };
      };
    }>;

    if (existingCartItem) {
      // Update existing cart item quantity
      const newQuantity = existingCartItem.quantity + quantity;

      if (totalStock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${totalStock}, Total requested: ${newQuantity}`,
        );
      }

      cartItem = await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await this.prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });
    }

    return {
      success: true,
      message: 'Item added to cart successfully',
      data: {
        ...cartItem,
        subtotal: cartItem.quantity * cartItem.product.price,
      },
    };
  }

  async removeFromCart(userId: string, cartItemId: string) {
    // Check if cart item exists and belongs to user
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return {
      success: true,
      message: `${cartItem.product.name} removed from cart successfully`,
      data: null,
    };
  }

  async updateCartItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // Check if cart item exists and belongs to user
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        userId,
      },
      include: {
        product: {
          include: {
            inventories: {
              select: {
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability
    const totalStock = cartItem.product.inventories.reduce(
      (sum, inv) => sum + inv.quantity,
      0,
    );

    if (totalStock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${totalStock}, Requested: ${quantity}`,
      );
    }

    const updatedCartItem = await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Cart item quantity updated successfully',
      data: {
        ...updatedCartItem,
        subtotal: updatedCartItem.quantity * updatedCartItem.product.price,
      },
    };
  }

  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      message: 'Cart cleared successfully',
      data: null,
    };
  }
}
