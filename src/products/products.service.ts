import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Validate that category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
  }

  async findAll(filterDto: FilterProductsDto) {
    const {
      search,
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      categoryId,
    } = filterDto;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
      categoryId?: string;
      price?: {
        gte?: number;
        lte?: number;
      };
    } = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          inventories: {
            include: {
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
      }),
      this.prisma.product.count({ where }),
    ]);

    // Calculate total stock for each product
    const productsWithStock = products.map((product) => ({
      ...product,
      totalStock: product.inventories.reduce(
        (sum, inv) => sum + inv.quantity,
        0,
      ),
      availableWarehouses: product.inventories.filter((inv) => inv.quantity > 0)
        .length,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Products retrieved successfully',
      data: {
        products: productsWithStock,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        inventories: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                capacity: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate total stock
    const totalStock = product.inventories.reduce(
      (sum, inv) => sum + inv.quantity,
      0,
    );

    return {
      success: true,
      message: 'Product retrieved successfully',
      data: {
        ...product,
        totalStock,
        availableWarehouses: product.inventories.filter(
          (inv) => inv.quantity > 0,
        ).length,
      },
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Validate category if it's being updated
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Prepare update data - handle categoryId properly
    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Product updated successfully',
      data: product,
    };
  }

  async remove(id: string) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        cartItems: true,
        orderItems: true,
        inventories: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is being used in orders or carts
    if (existingProduct.orderItems.length > 0) {
      throw new Error('Cannot delete product that has been ordered');
    }

    // Delete related inventories and cart items first
    await this.prisma.$transaction(async (tx) => {
      // Remove from carts
      await tx.cartItem.deleteMany({
        where: { productId: id },
      });

      // Remove inventories
      await tx.inventory.deleteMany({
        where: { productId: id },
      });

      // Delete product
      await tx.product.delete({
        where: { id },
      });
    });

    return {
      success: true,
      message: 'Product deleted successfully',
      data: null,
    };
  }
}
