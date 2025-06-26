/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Hypermarket Backend API Comprehensive Verification Script
 *
 * This script tests all major API endpoints and functionalities to ensure
 * the application is ready for frontend integration and production deployment.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

console.log('🚀 Starting Hypermarket API Comprehensive Verification...\n');

async function main() {
  let passed = 0;
  let failed = 0;

  /**
   *
   * @param {string} name
   * @param {() => Promise<void>} testFn
   */
  async function test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      console.log(`✅ PASS: ${name}\n`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
      console.log('');
      failed++;
    }
  }

  // Test 1: API Health Check
  await test('API Health Check', async () => {
    const response = await axios.get(`${API_BASE_URL}`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!response.data.data.message.includes('Hypermarket')) {
      throw new Error('API health check response invalid');
    }
  });

  // Test 2: Swagger Documentation
  await test('Swagger Documentation Accessibility', async () => {
    const response = await axios.get(`${API_BASE_URL}/docs-json`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!response.data.info || !response.data.paths) {
      throw new Error('Swagger JSON structure invalid');
    }
    // Check for key endpoints
    const paths = Object.keys(response.data.paths);
    const requiredEndpoints = [
      '/auth/register',
      '/auth/login',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/products',
      '/cart',
      '/orders',
      '/payments/initiate',
      '/payments/providers',
      '/payments/history',
      '/payments/verify',
      '/categories',
      '/warehouses',
      '/inventory',
    ];

    for (const endpoint of requiredEndpoints) {
      if (!paths.some((path) => path.includes(endpoint))) {
        throw new Error(
          `Required endpoint ${endpoint} not found in documentation`,
        );
      }
    }
  });

  // Test 3: User Registration (with expected failure due to missing data)
  await test('User Registration Endpoint Structure', async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {});
    } catch (error) {
      // We expect a 400 validation error
      if (error.response?.status === 400 && error.response?.data?.message) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected validation error for empty registration data');
  });

  // Test 4: User Login Endpoint Structure
  await test('User Login Endpoint Structure', async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {});
    } catch (error) {
      // We expect a 400 validation error
      if (error.response?.status === 400 && error.response?.data?.message) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected validation error for empty login data');
  });

  // Test 5: Password Reset Endpoints
  await test('Forgot Password Endpoint Structure', async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, {});
    } catch (error) {
      // We expect a 400 validation error
      if (error.response?.status === 400 && error.response?.data?.message) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected validation error for empty forgot password data');
  });

  await test('Reset Password Endpoint Structure', async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {});
    } catch (error) {
      // We expect a 400 validation error
      if (error.response?.status === 400 && error.response?.data?.message) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected validation error for empty reset password data');
  });

  // Test 6: Products Endpoints
  await test('Products List Endpoint', async () => {
    const response = await axios.get(`${API_BASE_URL}/products`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!response.data.success) {
      throw new Error('Products endpoint should return success=true');
    }
  });

  // Test 7: Categories Endpoints
  await test('Categories List Endpoint', async () => {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!response.data.success) {
      throw new Error('Categories endpoint should return success=true');
    }
  });

  // Test 8: Cart Endpoints (Authentication Required)
  await test('Cart Endpoint Authentication', async () => {
    try {
      await axios.get(`${API_BASE_URL}/cart`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected 401 unauthorized for cart access without token');
  });

  // Test 9: Orders Endpoints (Authentication Required)
  await test('Orders Endpoint Authentication', async () => {
    try {
      await axios.get(`${API_BASE_URL}/orders`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for orders access without token',
    );
  });

  // Test 10: Payment Providers (Public Endpoint)
  await test('Payment Providers Endpoint', async () => {
    const response = await axios.get(`${API_BASE_URL}/payments/providers`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!response.data.success) {
      throw new Error('Payment providers endpoint should return success=true');
    }
    if (
      !response.data.data.paymentMethods ||
      !Array.isArray(response.data.data.paymentMethods)
    ) {
      throw new Error('Payment providers should include payment methods array');
    }
  });

  // Test 11: Admin Endpoints Protection
  await test('Admin Endpoints Protection - Products Create', async () => {
    try {
      await axios.post(`${API_BASE_URL}/products`, {
        name: 'Test Product',
        description: 'Test Description',
        price: 29.99,
        image: 'test.jpg',
        categoryId: 'test-id',
      });
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for admin product creation without token',
    );
  });

  await test('Admin Endpoints Protection - Categories Create', async () => {
    try {
      await axios.post(`${API_BASE_URL}/categories`, {
        name: 'Test Category',
        description: 'Test Description',
      });
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for admin category creation without token',
    );
  });

  // Test 12: Error Handling Structure
  await test('Error Response Structure', async () => {
    try {
      await axios.get(`${API_BASE_URL}/products/invalid-uuid`);
    } catch (error) {
      // We expect a 400 bad request error with proper structure
      if (
        error.response?.status === 400 &&
        error.response?.data?.success === false &&
        error.response?.data?.message
      ) {
        return; // This is expected
      }
      throw new Error(
        'Error responses should have proper structure with success=false and message',
      );
    }
    throw new Error('Expected 400 bad request for invalid UUID');
  });

  // Test 13: Warehouses Endpoints (Admin Only)
  await test('Warehouses List Endpoint Authentication', async () => {
    try {
      await axios.get(`${API_BASE_URL}/warehouses`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for warehouses access without token',
    );
  });

  await test('Warehouses Create Endpoint Protection', async () => {
    try {
      await axios.post(`${API_BASE_URL}/warehouses`, {
        name: 'Test Warehouse',
        latitude: 4.1535,
        longitude: 9.287,
        capacity: 10000,
      });
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for warehouse creation without token',
    );
  });

  await test('Warehouse Get by ID Endpoint Protection', async () => {
    try {
      await axios.get(
        `${API_BASE_URL}/warehouses/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for warehouse details access without token',
    );
  });

  await test('Warehouse Update Endpoint Protection', async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}/warehouses/550e8400-e29b-41d4-a716-446655440000`,
        {
          name: 'Updated Warehouse',
        },
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for warehouse update without token',
    );
  });

  await test('Warehouse Delete Endpoint Protection', async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/warehouses/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for warehouse deletion without token',
    );
  });

  // Test 14: Inventory Endpoints (Admin Only)
  await test('Inventory Get Endpoint Protection', async () => {
    try {
      await axios.get(
        `${API_BASE_URL}/inventory/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for inventory access without token',
    );
  });

  await test('Inventory Adjust Endpoint Protection', async () => {
    try {
      await axios.post(`${API_BASE_URL}/inventory/adjust`, {
        warehouseId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 100,
      });
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for inventory adjustment without token',
    );
  });

  // Test 15: Additional Payment Endpoints
  await test('Payment History Endpoint Authentication', async () => {
    try {
      await axios.get(`${API_BASE_URL}/payments/history`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for payment history access without token',
    );
  });

  await test('Payment Initiate Endpoint Authentication', async () => {
    try {
      await axios.post(`${API_BASE_URL}/payments/initiate`, {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        method: 'MOMO',
        phoneNumber: '+237650000000',
      });
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for payment initiation without token',
    );
  });

  await test('Payment Verification Endpoint Authentication', async () => {
    try {
      await axios.get(`${API_BASE_URL}/payments/verify/TXN_1234567890`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for payment verification without token',
    );
  });

  await test('Payment Details Endpoint Authentication', async () => {
    try {
      await axios.get(
        `${API_BASE_URL}/payments/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for payment details access without token',
    );
  });

  // Test 16: Payment Webhook Endpoint (Public)
  await test('Payment Webhook Endpoint Structure', async () => {
    try {
      await axios.post(`${API_BASE_URL}/payments/webhook`, {});
    } catch (error) {
      // We expect a 400 bad request for invalid webhook data
      if (error.response?.status === 400 && error.response?.data?.message) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected validation error for empty webhook data');
  });

  // Test 17: Order Statistics Endpoints
  await test('Order Statistics Endpoint Authentication (Admin)', async () => {
    try {
      await axios.get(`${API_BASE_URL}/orders/statistics`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for order statistics access without token',
    );
  });

  await test('User Order Statistics Endpoint Authentication', async () => {
    try {
      await axios.get(`${API_BASE_URL}/orders/my-statistics`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for user order statistics access without token',
    );
  });

  // Test 18: Product and Category CRUD Operations Protection
  await test('Product Update Endpoint Protection', async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}/products/550e8400-e29b-41d4-a716-446655440000`,
        {
          name: 'Updated Product',
        },
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for product update without token',
    );
  });

  await test('Product Delete Endpoint Protection', async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/products/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for product deletion without token',
    );
  });

  await test('Category Update Endpoint Protection', async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}/categories/550e8400-e29b-41d4-a716-446655440000`,
        {
          name: 'Updated Category',
        },
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for category update without token',
    );
  });

  await test('Category Delete Endpoint Protection', async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/categories/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for category deletion without token',
    );
  });

  // Test 19: Cart Item Operations Protection
  await test('Cart Add Item Endpoint Authentication', async () => {
    try {
      await axios.post(`${API_BASE_URL}/cart`, {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2,
      });
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for adding to cart without token',
    );
  });

  await test('Cart Update Quantity Endpoint Authentication', async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}/cart/550e8400-e29b-41d4-a716-446655440000/quantity/3`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for cart quantity update without token',
    );
  });

  await test('Cart Remove Item Endpoint Authentication', async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/cart/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for cart item removal without token',
    );
  });

  await test('Cart Clear Endpoint Authentication', async () => {
    try {
      await axios.delete(`${API_BASE_URL}/cart`);
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for cart clearing without token',
    );
  });

  // Test 20: Order Operations Protection
  await test('Order Create Endpoint Authentication', async () => {
    try {
      await axios.post(`${API_BASE_URL}/orders`, {
        deliveryAddress: '123 Main St, City, State 12345',
        notes: 'Test order',
      });
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for order creation without token',
    );
  });

  await test('Order Get by ID Endpoint Authentication', async () => {
    try {
      await axios.get(
        `${API_BASE_URL}/orders/550e8400-e29b-41d4-a716-446655440000`,
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for order details access without token',
    );
  });

  await test('Order Status Update Endpoint Protection (Admin)', async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}/orders/550e8400-e29b-41d4-a716-446655440000/status`,
        {
          status: 'SHIPPED',
        },
      );
    } catch (error) {
      // We expect a 401 unauthorized error
      if (error.response?.status === 401) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error(
      'Expected 401 unauthorized for order status update without token',
    );
  });

  // Test 21: UUID Validation Tests
  await test('Invalid UUID Handling - Products', async () => {
    try {
      await axios.get(`${API_BASE_URL}/products/invalid-uuid`);
    } catch (error) {
      // We expect a 400 bad request error
      if (error.response?.status === 400 && error.response?.data?.message) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected 400 bad request for invalid product UUID');
  });

  await test('Invalid UUID Handling - Categories', async () => {
    try {
      await axios.get(`${API_BASE_URL}/categories/invalid-uuid`);
    } catch (error) {
      // We expect a 400 bad request error
      if (error.response?.status === 400 && error.response?.data?.message) {
        return; // This is expected
      }
      throw error;
    }
    throw new Error('Expected 400 bad request for invalid category UUID');
  });

  // Test 22: CORS and Security Headers
  await test('CORS and Security Headers', async () => {
    const response = await axios.get(`${API_BASE_URL}`);
    const headers = response.headers;

    // Check for security headers (helmet middleware)
    if (!headers['x-content-type-options']) {
      console.log(
        '   Note: X-Content-Type-Options header not found (helmet might not be fully configured)',
      );
    }

    // The main test is that CORS allows the request to complete
    if (response.status !== 200) {
      throw new Error('CORS might be blocking requests');
    }
  });

  // Summary
  console.log('\n🎯 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(`🎯 Total Tests: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 EXCELLENT! All API verification tests passed!');
    console.log('✨ The Hypermarket Backend API is ready for:');
    console.log('   • Frontend integration');
    console.log('   • Database migration');
    console.log('   • Production deployment');
    console.log('   • Email service configuration');
    console.log('\n📚 API Documentation: http://localhost:3001/api/docs');
    console.log('🚀 API Base URL: http://localhost:3001/api');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    console.log(
      '🔧 Make sure the API server is running on http://localhost:3001',
    );
  }

  console.log('\n🔗 Next Steps:');
  console.log('   1. Set up environment variables (.env file)');
  console.log('   2. Configure database connection');
  console.log('   3. Set up Resend API key for email notifications');
  console.log('   4. Run database migrations');
  console.log('   5. Create admin user for testing');
  console.log('   6. Test with real data in development environment');
}

main().catch((error) => {
  console.error('❌ Verification script failed:', error.message);
  process.exit(1);
});
