import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { FeeInvoicesService } from './fee-invoices.service';
import { CreateInvoiceRunDto } from './dto/create-fee-invoice.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('fee-invoices')
@UseGuards(TenantAuthGuard)
export class FeeInvoicesController {
  constructor(private readonly feeInvoicesService: FeeInvoicesService) {}

  @Get('dashboard/summary')
  async getDashboardSummary(@CurrentCampus() campusId: string) {
    return this.feeInvoicesService.getDashboardSummary(campusId);
  }

  @Post('batch-run')
  async createBatchRun(
    @Body() dto: CreateInvoiceRunDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.feeInvoicesService.createBatchRun(dto, campusId);
  }

  @Get()
  async findAll(@CurrentCampus() campusId: string) {
    return this.feeInvoicesService.findAllByCampus(campusId);
  }
}