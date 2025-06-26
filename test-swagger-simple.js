/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const { spawn } = require('child_process');

console.log('🚀 Starting Hypermarket Backend with Swagger Documentation...\n');

// Set environment to development
process.env.NODE_ENV = 'development';

// Start the server
const server = spawn('npm', ['run', 'start:dev'], {
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' },
});

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);

  // Check if server has started
  if (output.includes('Application is running on')) {
    // Wait a moment for full startup
    setTimeout(testSwaggerEndpoints, 3000);
  }
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

function testSwaggerEndpoints() {
  console.log('\n📚 Testing Swagger Documentation endpoints...\n');

  // Test Swagger UI
  const req1 = http.request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/docs',
      method: 'GET',
      timeout: 5000,
    },
    (res) => {
      if (res.statusCode === 200) {
        console.log(
          '✅ Swagger UI is accessible at: http://localhost:3001/api/docs',
        );
      } else {
        console.log(`❌ Swagger UI returned status: ${res.statusCode}`);
      }
    },
  );

  req1.on('error', (err) => {
    console.log('❌ Error testing Swagger UI:', err.message);
  });

  req1.on('timeout', () => {
    console.log('❌ Timeout testing Swagger UI');
    req1.destroy();
  });

  req1.end();

  // Test OpenAPI JSON
  setTimeout(() => {
    const req2 = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/docs-json',
        method: 'GET',
        timeout: 5000,
      },
      (res) => {
        if (res.statusCode === 200) {
          console.log(
            '✅ OpenAPI JSON is accessible at: http://localhost:3001/api/docs-json',
          );

          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const openApiDoc = JSON.parse(data);
              console.log(
                `📄 API Title: ${openApiDoc.info?.title || 'Unknown'}`,
              );
              console.log(
                `🔖 API Version: ${openApiDoc.info?.version || 'Unknown'}`,
              );

              const paths = Object.keys(openApiDoc.paths || {});
              console.log(`🛣️  Available endpoints: ${paths.length}`);

              if (paths.length > 0) {
                console.log('\n🎯 Documented endpoints:');
                paths
                  .slice(0, 10)
                  .forEach((path) => console.log(`   - ${path}`));
                if (paths.length > 10) {
                  console.log(`   ... and ${paths.length - 10} more`);
                }
              }

              console.log('\n🎉 Swagger implementation successful!');
              console.log('\n📚 Access your API documentation at:');
              console.log('   🌐 Swagger UI: http://localhost:3001/api/docs');
              console.log(
                '   📄 OpenAPI JSON: http://localhost:3001/api/docs-json',
              );
            } catch (err) {
              console.log('❌ Error parsing OpenAPI JSON:', err.message);
            }
          });
        } else {
          console.log(`❌ OpenAPI JSON returned status: ${res.statusCode}`);
        }
      },
    );

    req2.on('error', (err) => {
      console.log('❌ Error testing OpenAPI JSON:', err.message);
    });

    req2.on('timeout', () => {
      console.log('❌ Timeout testing OpenAPI JSON');
      req2.destroy();
    });

    req2.end();
  }, 15_000);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.kill('SIGINT');
  process.exit(0);
});

console.log('⏳ Waiting for server to start...');
console.log('💡 Press Ctrl+C to stop the server\n');
