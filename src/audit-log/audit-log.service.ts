import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path if needed

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async logAction(params: {
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        user_id: params.user_id,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
      },
    });
  }
}
