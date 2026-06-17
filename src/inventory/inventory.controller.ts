import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('api/inventory')
@UseGuards(TenantAuthGuard) // 🛡️ Standardized multi-tenant protection for the asset ledger
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async create(
    @Body() createDto: any, 
    @CurrentCampus() campusId: string, // 🔑 Automatically extracted from verified token context
    @Req() req: any
  ) {
    // Safely reads the user ID attached to the request by the TenantAuthGuard passport pipeline
    const userId = req.user.id || req.user.userId; 

    return this.inventoryService.createItem(createDto, userId, campusId);
  }

  @Get()
  async findAll(@CurrentCampus() campusId: string) {
    // 🔑 Header fallback checks are completely bypassed. The decorator handles verification upstream.
    return this.inventoryService.findAllItems(campusId);
  }
}