import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cors from 'cors';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }),
  );

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests, please try again later.',
        errors: [{ message: 'Rate limit exceeded' }],
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3001;
  // Swagger setup - Only available in development mode
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Hypermarket API')
      .setDescription(
        'Comprehensive API documentation for the Hypermarket backend application. ' +
          'This documentation provides detailed information about all available endpoints, ' +
          'request/response schemas, and authentication requirements.',
      )
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
      .addTag('Categories', 'Category management endpoints')
      .addTag('Cart', 'Shopping cart endpoints')
      .addTag('Orders', 'Order management endpoints')
      .addTag('Payments', 'Payment processing endpoints')
      .addServer('http://localhost:3001', 'Development Server')
      .addServer('https://api.hypermarket.com', 'Production Server')
      .setContact(
        'API Support',
        'https://hypermarket.com/support',
        'support@hypermarket.com',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      // .addOAuth2({
      //   type: 'oauth2',
      //   flows: {
      //     password: {
      //       tokenUrl: '/auth/token',
      //       scopes: {
      //         read: 'Read access to protected resources',
      //         write: 'Write access to protected resources',
      //       },
      //     },
      //   },
      // })
      // .addApiKey(
      //   {
      //     type: 'apiKey',
      //     name: 'X-API-KEY',
      //     in: 'header',
      //   },
      //   'X-API-KEY',
      // )
      // .addSecurityRequirements('JWT-auth')
      // .addSecurityRequirements('X-API-KEY')
      // .setExternalDoc(
      //   'GitHub Repository',
      //   'https://github.com/your-repo/hypermarket-backend',
      // )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });

    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Hypermarket API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    });

    console.log(
      `📚 API Documentation available at: http://localhost:${port}/api/docs`,
    );
  }

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
void bootstrap();
