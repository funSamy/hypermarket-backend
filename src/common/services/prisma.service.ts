import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  onModuleInit() {
    // For Neon databases, we'll use lazy connection instead of connecting at startup
    // This allows the app to start even if the database is sleeping
    this.logger.log(
      'PrismaService initialized - using lazy connection for Neon database',
    );
  }

  // Override the $connect method to add retry logic for individual operations
  async $connect(): Promise<void> {
    let retries = 3;
    while (retries > 0) {
      try {
        await super.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (error) {
        retries--;
        this.logger.warn(
          `Database connection failed, retries left: ${retries}`,
        );
        if (retries === 0) {
          this.logger.error(
            'Failed to connect to database after all retries',
            error,
          );
          throw error;
        }
        // Wait before retrying - longer wait for Neon database wake-up
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
