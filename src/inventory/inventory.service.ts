import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async createItem(data: any, userId: string, campusId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          name: data.name,
          sku: data.sku,
          total_quantity: data.quantity,
          available_quantity: data.quantity,
          inventory_category_id: data.categoryId,
          campus_id: campusId,
        },
      });

      // 🔄 Record the transactional tracking event
      await tx.inventoryTransaction.create({
        data: {
          item: {
            connect: { id: item.id }
          },
          campus: {
            connect: { id: campusId } // 🔄 FIXED: Dynamically binds to the active tenant scope
          },
          user: {
            connect: { id: userId } // 🔄 FIXED: Dynamically attributes action to the real active user
          },
          type: 'STOCK_IN',
          quantity: data.quantity,
        },
      });

      // 📝 Write directly to system audit records
      await this.auditLog.logAction({
        user_id: userId,
        action: `INVENTORY_CREATE: Created supply item ${item.name} (SKU: ${item.sku}) with stock ${data.quantity}`,
        entity_type: 'InventoryItem',
        entity_id: item.id,
      });

      return item;
    });
  }

  async findAllItems(campusId: string) {
    return this.prisma.client.inventoryItem.findMany({
      where: { campus_id: campusId },
      orderBy: { updated_at: 'desc' },
    });
  }
}