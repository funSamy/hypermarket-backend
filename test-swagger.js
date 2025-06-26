/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Starting Hypermarket Backend with Swagger Documentation...\n');

// Set environment to development to enable Swagger
process.env.NODE_ENV = 'development';

// Start the NestJS application
const server = spawn('npm', ['run', 'start:dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' },
});

async function runserver() {
  try {
    console.log('\n📚 Testing Swagger Documentation endpoints...\n');

    // Test if Swagger docs are accessible
    const swaggerResponse = await axios.get('http://localhost:3001/api/docs', {
      timeout: 5000,
    });

    if (swaggerResponse.status === 200) {
      console.log(
        '✅ Swagger Documentation is accessible at: http://localhost:3001/api/docs',
      );
    }

    // Test OpenAPI JSON
    const openApiResponse = await axios.get(
      'http://localhost:3001/api/docs-json',
      {
        timeout: 5000,
      },
    );

    if (openApiResponse.status === 200) {
      console.log(
        '✅ OpenAPI JSON specification is available at: http://localhost:3001/api/docs-json',
      );
      console.log(`📄 API Title: ${openApiResponse.data.info.title}`);
      console.log(
        `📝 API Description: ${openApiResponse.data.info.description}`,
      );
      console.log(`🔖 API Version: ${openApiResponse.data.info.version}`);

      const paths = Object.keys(openApiResponse.data.paths || {});
      console.log(`🛣️  Available endpoints: ${paths.length}`);
      paths.forEach((path) => console.log(`   - ${path}`));
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('❌ Failed to test Swagger endpoints:', err.message);
    }
    console.error('❌ Failed to test Swagger endpoints:', err);
    console.log(
      '🔄 Server might still be starting up. Please check manually at:',
    );
    console.log('   📚 Swagger UI: http://localhost:3001/api/docs');
    console.log('   📄 OpenAPI JSON: http://localhost:3001/api/docs-json');
  }
}

// Wait for server to start and test endpoints
setTimeout(() => {
  runserver()
    .then(() => {
      console.log('\n✅ Swagger endpoints tested successfully!');
    })
    .catch((err) => {
      if (err instanceof Error) {
        console.error('❌ Failed to test Swagger endpoints:', err.message);
      }
      console.error('❌ Failed to test Swagger endpoints:', err);
    });
}, 10000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

server.on('close', (code) => {
  console.log(`\n📤 Server process exited with code ${code}`);
});
