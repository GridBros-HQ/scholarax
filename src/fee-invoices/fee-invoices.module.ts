import { Module } from '@nestjs/common';
import { FeeInvoicesService } from './fee-invoices.service';
import { FeeInvoicesController } from './fee-invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeInvoicesController],
  providers: [FeeInvoicesService],
})
export class FeeInvoicesModule {}