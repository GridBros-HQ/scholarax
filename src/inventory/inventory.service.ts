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
    return this.prisma.$transaction(async (tx) => {
      // Changed tx.inventory_item to tx.inventoryItem
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

      // Changed tx.inventory_transaction to tx.inventoryTransaction
      await tx.inventoryTransaction.create({
        data: {
          inventory_item_id: item.id,
          campus_id: campusId,
          type: 'STOCK_IN',
          quantity: data.quantity,
          performed_by: userId,
        },
      });

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
    // Changed this.prisma.inventory_item to this.prisma.inventoryItem
    return this.prisma.inventoryItem.findMany({
      where: { campus_id: campusId },
      orderBy: { updated_at: 'desc' },
    });
  }
}