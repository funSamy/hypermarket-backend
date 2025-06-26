# Hypermarket API Documentation with Swagger

This document provides comprehensive information about the Swagger API documentation implementation for the Hypermarket backend application.

## 🚀 Quick Start

### Accessing the API Documentation

The API documentation is **only available in development mode** and can be accessed at:

- **Swagger UI**: `http://localhost:3001/api/docs`
- **OpenAPI JSON**: `http://localhost:3001/api/docs-json`

### Starting the Application

```bash
# Development mode (Swagger enabled)
npm run start:dev

# Production mode (Swagger disabled)
NODE_ENV=production npm run start:prod
```

## 📚 Features

### Comprehensive API Documentation

- **Complete endpoint coverage**: All controllers and endpoints are documented
- **Request/Response schemas**: Detailed DTO documentation with examples
- **Authentication support**: JWT Bearer token authentication setup
- **Error responses**: Comprehensive error response documentation
- **Interactive testing**: Built-in API testing interface

### Security Configuration

- **JWT Authentication**: Bearer token support with `@ApiBearerAuth('JWT-auth')`
- **Environment restrictions**: Only available in development mode
- **CORS support**: Properly configured for frontend integration

### Documentation Structure

```
├── Auth Module
│   ├── POST /api/auth/register - User registration
│   └── POST /api/auth/login - User authentication
├── Products Module
│   ├── GET /api/products - List all products (with filtering)
│   ├── GET /api/products/:id - Get product by ID
│   ├── POST /api/products - Create product (Admin only)
│   ├── PATCH /api/products/:id - Update product (Admin only)
│   └── DELETE /api/products/:id - Delete product (Admin only)
├── Categories Module
│   ├── GET /api/categories - List all categories
│   ├── GET /api/categories/:id - Get category by ID
│   ├── POST /api/categories - Create category (Admin only)
│   ├── PATCH /api/categories/:id - Update category (Admin only)
│   └── DELETE /api/categories/:id - Delete category (Admin only)
├── Cart Module
│   ├── GET /api/cart - Get user's cart
│   ├── POST /api/cart/add - Add item to cart
│   ├── PATCH /api/cart/update - Update cart item
│   └── DELETE /api/cart/remove/:id - Remove item from cart
├── Orders Module
│   ├── GET /api/orders - List user's orders
│   ├── GET /api/orders/:id - Get order by ID
│   ├── POST /api/orders - Create order
│   └── PATCH /api/orders/:id/status - Update order status (Admin only)
└── Payments Module
    ├── POST /api/payments/process - Process payment
    ├── POST /api/payments/webhook - Payment webhook
    └── GET /api/payments/:orderId/status - Get payment status
```

## 🔧 Configuration

### Swagger Setup (main.ts)

```typescript
// Swagger setup - Only available in development mode
if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Hypermarket API')
    .setDescription('Comprehensive API documentation...')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Products', 'Product management endpoints')
    // ... more tags
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

### DTO Documentation Example

```typescript
@ApiProperty({
  description: 'Name of the product',
  example: 'iPhone 14 Pro',
  minLength: 1,
  maxLength: 255,
})
@IsNotEmpty()
@IsString()
name: string;
```

### Controller Documentation Example

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product with the provided information...',
  })
  @ApiResponse({
    status: 201,
    description: 'Product successfully created',
    type: ProductResponseDto,
  })
  // ... more decorators
  create(@Body() createProductDto: CreateProductDto) {
    // implementation
  }
}
```

## 📝 Response Formats

### Success Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data object
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error occurred",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### Paginated Response Format

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## 🔐 Authentication

### Using JWT Tokens

1. **Register or Login** to get an access token
2. **Click the "Authorize" button** in Swagger UI
3. **Enter the token** in the format: `Bearer your-jwt-token-here`
4. **Test protected endpoints** with authentication

### Example Authentication Flow

```bash
# 1. Register a new user
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890"
}

# 2. Response includes access token
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

# 3. Use token for protected endpoints
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Testing

### Manual Testing

1. Start the application in development mode
2. Open `http://localhost:3001/api/docs` in your browser
3. Use the interactive interface to test endpoints
4. Authenticate using the "Authorize" button for protected routes

### Automated Testing

```bash
# Test Swagger setup
node test-swagger.js

# Run API tests
npm run test:e2e
```

### Example Test Cases

- **Authentication**: Register → Login → Access protected endpoint
- **Product Management**: Create → Read → Update → Delete
- **Filtering**: Test product search and pagination
- **Error Handling**: Test validation errors and 404 responses

## 🔍 Query Parameters

### Pagination

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Filtering

- `search`: Search term for name/description
- `categoryId`: Filter by category
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

### Example Usage

```
GET /api/products?page=2&limit=20&search=iPhone&categoryId=uuid&minPrice=500&maxPrice=1500
```

## 🚀 Best Practices

### For API Consumers

1. **Always check the `success` field** in responses
2. **Handle error responses** appropriately
3. **Use pagination** for large datasets
4. **Include authentication tokens** for protected endpoints
5. **Validate data** before sending requests

### For Developers

1. **Keep DTOs updated** with proper Swagger decorators
2. **Include comprehensive examples** in API documentation
3. **Document all error cases** with appropriate HTTP status codes
4. **Use semantic versioning** for API changes
5. **Test documentation** regularly during development

## 🔧 Customization

### Adding New Endpoints

1. **Create/Update DTOs** with `@ApiProperty()` decorators
2. **Add controller methods** with appropriate Swagger decorators
3. **Document responses** including success and error cases
4. **Add examples** for request/response bodies
5. **Test the documentation** in Swagger UI

### Swagger Decorators Reference

- `@ApiTags()`: Group endpoints by module
- `@ApiOperation()`: Describe endpoint purpose
- `@ApiResponse()`: Document response schemas
- `@ApiParam()`: Document path parameters
- `@ApiQuery()`: Document query parameters
- `@ApiBody()`: Document request body
- `@ApiBearerAuth()`: Require authentication

## 📞 Support

For questions or issues with the API documentation:

- **Email**: support@hypermarket.com
- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests

---

**Note**: This API documentation is automatically generated and kept in sync with the actual implementation. Always refer to the live Swagger UI for the most up-to-date information.
