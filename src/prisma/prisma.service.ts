import * as dotenv from 'dotenv';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { tenantContext } from './tenant-context';

dotenv.config();

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  private readonly rootClient: PrismaClient;
  public readonly client: any;

  constructor() {
    // Initialize a native PostgreSQL connection pool
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Wrap the connection pool inside Prisma 7's required Driver Adapter
    const adapter = new PrismaPg(this.pool);

    // Construct the lightweight Prisma 7 Client with the active adapter
    const baseClient = new PrismaClient({ adapter });
    this.rootClient = baseClient;

    // Build the extended client layer to inject absolute multi-tenant isolation natively
    this.client = baseClient.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const store = tenantContext.getStore();
            const campusId = store?.campusId;

            // 🛡️ CORE SECURITY FIX: Inject tenant boundaries directly into query parameters
            if (
              campusId && 
              ['findMany', 'findFirst', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany', 'count'].includes(operation)
            ) {
              // 🔑 CAST TO ANY: Tells TypeScript to bypass union-checking here because we've 
              // already restricted this execution block to query operations that support '.where'
              const queryArgs = args as any;
              queryArgs.where = queryArgs.where || {};
              
              // Handles both snake_case and camelCase column schemas automatically across all operational tables
              if (
                'campus_id' in queryArgs.where || 
                ['inventoryitem', 'inventorytransaction', 'student', 'attendancerecord'].includes(model.toLowerCase())
              ) {
                queryArgs.where['campus_id'] = campusId;
              } else {
                queryArgs.where['campusId'] = campusId;
              }
            }

            return query(args);
          },
        },
      },
    });

    // Proxy incoming calls to transparently route model calls (e.g., this.prisma.user) to this.client
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'baseClient' || prop === 'base') {
          return target.client;
        }
        if (prop in target) {
          return (target as any)[prop];
        }
        return target.client[prop];
      },
    });
  }

  async onModuleInit() {
    await this.rootClient.$connect();
  }

  async onModuleDestroy() {
    await this.rootClient.$disconnect();
    await this.pool.end(); // Cleanly tear down the native PG connection pool
  }
}