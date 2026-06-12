import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Module({
  providers: [AuditLogService],
  exports: [AuditLogService], // 👈 Crucial so InventoryModule can see it
})
export class AuditLogModule {}