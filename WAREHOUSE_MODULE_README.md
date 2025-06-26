# Warehouse & Inventory Management Module

## Overview

The Warehouse & Inventory Management Module provides comprehensive functionality for hypermarket operators to manage their physical warehouse locations and track inventory across multiple locations. This module is essential for order fulfillment and stock management.

## Features

### ✅ Complete Warehouse Management

- Create and manage multiple warehouse locations
- Geospatial support with latitude/longitude coordinates
- Capacity tracking and management
- Safe deletion with inventory validation

### ✅ Advanced Inventory Management

- Real-time stock tracking across warehouses
- Inventory adjustment with upsert functionality
- Pagination support for large inventory datasets
- Cross-warehouse stock aggregation

### ✅ Security & Authorization

- **Admin-only access** - All endpoints require ADMIN role
- JWT authentication protection
- Comprehensive input validation
- UUID parameter validation

## API Endpoints

### Warehouse Management

#### Create Warehouse

```http
POST /api/warehouses
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Buea Central Warehouse",
  "latitude": 4.1535,
  "longitude": 9.2870,
  "capacity": 10000
}
```

#### List All Warehouses

```http
GET /api/warehouses
Authorization: Bearer {jwt_token}
```

#### Get Warehouse Details

```http
GET /api/warehouses/{warehouseId}
Authorization: Bearer {jwt_token}
```

#### Update Warehouse

```http
PATCH /api/warehouses/{warehouseId}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Updated Warehouse Name",
  "capacity": 15000
}
```

#### Delete Warehouse

```http
DELETE /api/warehouses/{warehouseId}
Authorization: Bearer {jwt_token}
```

### Inventory Management

#### Get Warehouse Inventory

```http
GET /api/inventory/{warehouseId}?page=1&limit=10
Authorization: Bearer {jwt_token}
```

#### Adjust Inventory

```http
POST /api/inventory/adjust
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "warehouseId": "550e8400-e29b-41d4-a716-446655440000",
  "productId": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 100
}
```

## DTOs (Data Transfer Objects)

### CreateWarehouseDto

```typescript
{
  name: string; // Required, warehouse name
  latitude: number; // Required, valid latitude (-90 to 90)
  longitude: number; // Required, valid longitude (-180 to 180)
  capacity: number; // Required, minimum 1
}
```

### UpdateWarehouseDto

```typescript
{
  name?: string;       // Optional
  latitude?: number;   // Optional
  longitude?: number;  // Optional
  capacity?: number;   // Optional
}
```

### AdjustInventoryDto

```typescript
{
  warehouseId: string; // Required, valid UUID
  productId: string; // Required, valid UUID
  quantity: number; // Required, new total quantity
}
```

## Response Examples

### Warehouse Response

```json
{
  "success": true,
  "message": "Warehouse retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Buea Central Warehouse",
    "latitude": 4.1535,
    "longitude": 9.287,
    "capacity": 10000,
    "inventories": [
      {
        "id": "inventory-uuid",
        "quantity": 50,
        "product": {
          "id": "product-uuid",
          "name": "Product Name",
          "price": 2500,
          "category": {
            "name": "Category Name"
          }
        }
      }
    ]
  }
}
```

### Inventory Response

```json
{
  "success": true,
  "message": "Inventory retrieved successfully",
  "data": {
    "data": [
      {
        "id": "inventory-uuid",
        "quantity": 50,
        "product": {
          "id": "product-uuid",
          "name": "Product Name",
          "description": "Product description",
          "price": 2500,
          "category": {
            "name": "Category Name"
          }
        },
        "warehouse": {
          "id": "warehouse-uuid",
          "name": "Buea Central Warehouse",
          "latitude": 4.1535,
          "longitude": 9.287
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

## Integration with Existing Systems

### Products Module

- Products automatically include total stock calculation across all warehouses
- Product responses include warehouse details and availability
- Cross-warehouse inventory aggregation built-in

### Orders Module (FulfillmentService)

- Can now utilize actual warehouse data for order fulfillment
- Geospatial warehouse selection based on delivery location
- Multi-warehouse inventory allocation
- Distance-based delivery optimization

### Database Schema

- Full UUID support as per updated Prisma schema
- Proper foreign key relationships with products and warehouses
- Transaction safety and data integrity

## Security Features

### Role-Based Access Control

- All endpoints require `ADMIN` role using `@Roles(Role.ADMIN)`
- Protected with `JwtAuthGuard` for secure access
- Comprehensive input validation using `class-validator`

### Data Validation

- UUID validation using `ParseUUIDPipe`
- Geospatial coordinate validation (latitude/longitude)
- Capacity and quantity validation with minimum constraints
- Product and warehouse existence validation

### Safety Features

- Prevents warehouse deletion if inventory exists
- Validates product and warehouse existence before inventory operations
- Proper error handling and meaningful error messages

## Advanced Features

### Inventory Upsert Operations

The `adjustInventory` endpoint intelligently:

1. Updates existing inventory records if they exist
2. Creates new inventory records for new product-warehouse combinations
3. Validates all relationships before operations
4. Provides detailed responses including all related data

### Pagination Support

Inventory listing includes built-in pagination:

- Configurable page size (default: 10 items)
- Total count and page calculation
- Ordered by product name for consistency

### Cross-Warehouse Analytics

- `getTotalInventoryForProduct()` aggregates stock across all warehouses
- Products service includes total stock and available warehouse counts
- Support for multi-location inventory management

## Error Handling

### Common Error Responses

#### 404 - Not Found

```json
{
  "success": false,
  "message": "Warehouse with ID {id} not found",
  "statusCode": 404
}
```

#### 400 - Bad Request (Validation Error)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "latitude must be a valid latitude",
    "capacity must be at least 1"
  ],
  "statusCode": 400
}
```

#### 400 - Business Logic Error

```json
{
  "success": false,
  "message": "Cannot delete warehouse that still contains inventory items. Please move or remove all inventory first.",
  "statusCode": 400
}
```

#### 401 - Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

#### 403 - Forbidden

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "statusCode": 403
}
```

## Usage Examples

### Setting Up a New Warehouse

1. Create warehouse with location and capacity
2. Add products to the warehouse using inventory adjustment
3. Monitor stock levels through inventory listing
4. Update warehouse details as needed

### Managing Inventory

1. Use `GET /api/inventory/{warehouseId}` to view current stock
2. Use `POST /api/inventory/adjust` to update quantities
3. Monitor total stock across warehouses via products endpoints
4. Track inventory movements for business analytics

### Order Fulfillment Integration

1. FulfillmentService can now query actual warehouse locations
2. Calculate distances for delivery optimization
3. Allocate inventory from multiple warehouses if needed
4. Reserve inventory during order processing

## Module Files Structure

```
src/warehouse/
├── dto/
│   ├── create-warehouse.dto.ts
│   ├── update-warehouse.dto.ts
│   └── adjust-inventory.dto.ts
├── warehouse.controller.ts
├── inventory.controller.ts
├── warehouse.service.ts
├── inventory.service.ts
├── warehouse.module.ts
└── index.ts
```

## Dependencies

- `@nestjs/common` - Core NestJS functionality
- `@prisma/client` - Database operations
- `class-validator` - Input validation
- `class-transformer` - Data transformation
- PrismaService - Database service
- JWT Authentication guards
- Role-based authorization guards

This module provides a complete foundation for warehouse and inventory management in the Hypermarket Backend API, enabling full control over stock levels and warehouse operations for hypermarket administrators.
