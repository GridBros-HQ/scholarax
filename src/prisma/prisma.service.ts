import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { tenantContext } from './tenant-context';

@Injectable()
export class PrismaService implements OnModuleInit {
  private baseClient: PrismaClient;
  public client: any;

  constructor() {
    // 1. Initialize a native PostgreSQL connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Wrap the connection pool inside Prisma 7's required Driver Adapter
    const adapter = new PrismaPg(pool);

    // 3. Construct the lightweight Prisma 7 Client with the active adapter
    this.baseClient = new PrismaClient({ adapter });

    // 4. Build the extended client layer to inject Row-Level Security variables
    this.client = this.baseClient.$extends({
      query: {
        $allOperations: async ({ model, operation, args, query }) => {
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

    // 5. Proxy all model properties (user, campus, etc.) straight onto this service class
    Object.assign(this, this.client);
  }

  async onModuleInit() {
    // Connection pool handles initialization automatically upon first database transaction
  }
}