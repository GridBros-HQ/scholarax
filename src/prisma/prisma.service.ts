import * as dotenv from 'dotenv';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { tenantContext } from './tenant-context';

dotenv.config();

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly baseClient: PrismaClient;
  public readonly client: any;

  constructor() {
    // Initialize a native PostgreSQL connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Wrap the connection pool inside Prisma 7's required Driver Adapter
    const adapter = new PrismaPg(pool);

    // Construct the lightweight Prisma 7 Client with the active adapter
    this.baseClient = new PrismaClient({ adapter });

    // Build the extended client layer to inject Row-Level Security variables
    this.client = this.baseClient.$extends({
      query: {
        $allOperations: async ({ args, query }) => {
          const store = tenantContext.getStore();
          const campusId = store?.campusId;

          // If a multi-tenant campus context is active, force query isolation
          if (campusId) {
            return this.baseClient.$transaction(async (tx) => {
              await tx.$executeRawUnsafe(`SET LOCAL app.current_campus_id = '${campusId}';`);
              return query(args);
            });
          }

          // If no context is set (background worker/system routines), execute normally
          return query(args);
        },
      },
    });

    // Proxy incoming calls to transparently route model calls (e.g., this.prisma.user) to this.client
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) {
          return (target as any)[prop];
        }
        return target.client[prop];
      },
    });
  }

  async onModuleInit() {
    await this.baseClient.$connect();
  }

  async onModuleDestroy() {
    await this.baseClient.$disconnect();
  }
}
