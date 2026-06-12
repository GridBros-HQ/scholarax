import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Replace with your actual guard path

@Controller('api/inventory')
@UseGuards(JwtAuthGuard) // 👈 Protect the whole domain
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async create(@Body() createDto: any, @Req() req: any) {
    // Extracting user ID and campus context injected by your guards
    const userId = req.user.id;
    const campusId = req.headers['x-campus-id'] || req.user.campusId;

    return this.inventoryService.createItem(createDto, userId, campusId);
  }

  @Get()
  async findAll(@Req() req: any) {
    const campusId = req.headers['x-campus-id'] || req.user.campusId;
    return this.inventoryService.findAllItems(campusId);
  }
}