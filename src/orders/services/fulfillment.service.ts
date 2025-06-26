import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface FulfillmentPlan {
  warehouseId: string;
  warehouseName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  distance?: number;
  estimatedDeliveryDays: number;
}

export interface FulfillmentResult {
  plans: FulfillmentPlan[];
  totalCost: number;
  totalItems: number;
  estimatedDeliveryDays: number;
  canFulfill: boolean;
  unfulfillableItems: {
    productId: string;
    productName: string;
    requestedQuantity: number;
    availableQuantity: number;
  }[];
}

@Injectable()
export class FulfillmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate the distance between two points using the Haversine formula
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate delivery days based on distance
   * @param distance Distance in kilometers
   * @returns Estimated delivery days
   */
  private estimateDeliveryDays(distance: number): number {
    if (distance <= 50) return 1; // Same city/region
    if (distance <= 200) return 2; // Regional delivery
    if (distance <= 500) return 3; // National delivery
    return 5; // Long distance
  }

  /**
   * Calculate the optimal fulfillment strategy for an order
   * @param items Order items
   * @param deliveryLatitude Optional delivery latitude
   * @param deliveryLongitude Optional delivery longitude
   * @returns Fulfillment result with optimal plan
   */
  async calculateFulfillmentStrategy(
    items: OrderItem[],
    deliveryLatitude?: number,
    deliveryLongitude?: number,
  ): Promise<FulfillmentResult> {
    // Get all products with their inventory information
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: items.map((item) => item.productId) },
      },
      include: {
        inventories: {
          include: {
            warehouse: true,
          },
          where: {
            quantity: { gt: 0 }, // Only warehouses with stock
          },
        },
      },
    });

    // Create a map for quick product lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    const unfulfillableItems: FulfillmentResult['unfulfillableItems'] = [];
    const warehousePlans = new Map<string, FulfillmentPlan>();

    // Check each item and find the best fulfillment strategy
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      let remainingQuantity = item.quantity;
      const availableInventories = product.inventories.sort((a, b) => {
        // Sort by distance if delivery coordinates are provided
        if (deliveryLatitude && deliveryLongitude) {
          const distA = this.calculateDistance(
            deliveryLatitude,
            deliveryLongitude,
            a.warehouse.latitude,
            a.warehouse.longitude,
          );
          const distB = this.calculateDistance(
            deliveryLatitude,
            deliveryLongitude,
            b.warehouse.latitude,
            b.warehouse.longitude,
          );
          return distA - distB;
        }
        // Otherwise sort by stock quantity (prefer warehouses with more stock)
        return b.quantity - a.quantity;
      });

      // Try to fulfill from available warehouses
      for (const inventory of availableInventories) {
        if (remainingQuantity <= 0) break;

        const quantityToTake = Math.min(remainingQuantity, inventory.quantity);
        const warehouseId = inventory.warehouse.id;

        // Calculate distance if delivery coordinates are provided
        let distance: number | undefined;
        if (deliveryLatitude && deliveryLongitude) {
          distance = this.calculateDistance(
            deliveryLatitude,
            deliveryLongitude,
            inventory.warehouse.latitude,
            inventory.warehouse.longitude,
          );
        }

        // Get or create warehouse plan
        if (!warehousePlans.has(warehouseId)) {
          warehousePlans.set(warehouseId, {
            warehouseId,
            warehouseName: inventory.warehouse.name,
            items: [],
            subtotal: 0,
            distance,
            estimatedDeliveryDays: distance
              ? this.estimateDeliveryDays(distance)
              : 2,
          });
        }

        const plan = warehousePlans.get(warehouseId)!;

        // Add item to warehouse plan
        plan.items.push({
          productId: item.productId,
          productName: product.name,
          quantity: quantityToTake,
          unitPrice: product.price,
        });

        plan.subtotal += quantityToTake * product.price;
        remainingQuantity -= quantityToTake;
      }

      // Track unfulfillable items
      if (remainingQuantity > 0) {
        const totalAvailable = product.inventories.reduce(
          (sum, inv) => sum + inv.quantity,
          0,
        );
        unfulfillableItems.push({
          productId: item.productId,
          productName: product.name,
          requestedQuantity: item.quantity,
          availableQuantity: totalAvailable,
        });
      }
    }

    const plans = Array.from(warehousePlans.values());
    const totalCost = plans.reduce((sum, plan) => sum + plan.subtotal, 0);
    const totalItems = plans.reduce(
      (sum, plan) =>
        sum + plan.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    );
    const estimatedDeliveryDays = Math.max(
      ...plans.map((plan) => plan.estimatedDeliveryDays),
      1,
    );

    return {
      plans,
      totalCost,
      totalItems,
      estimatedDeliveryDays,
      canFulfill: unfulfillableItems.length === 0,
      unfulfillableItems,
    };
  }

  /**
   * Reserve inventory for an order
   * @param fulfillmentPlans The fulfillment plans to execute
   * @returns Success status
   */
  async reserveInventory(
    fulfillmentPlans: FulfillmentPlan[],
  ): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const plan of fulfillmentPlans) {
          for (const item of plan.items) {
            // Find the specific inventory record
            const inventory = await tx.inventory.findFirst({
              where: {
                warehouseId: plan.warehouseId,
                productId: item.productId,
                quantity: { gte: item.quantity },
              },
            });

            if (!inventory) {
              throw new Error(
                `Insufficient inventory for product ${item.productId} in warehouse ${plan.warehouseId}`,
              );
            }

            // Reduce inventory
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: inventory.quantity - item.quantity,
              },
            });
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to reserve inventory:', error);
      return false;
    }
  }
}
