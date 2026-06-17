import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { FeeComponentsService } from './fee-components.service';
import { CreateFeeComponentDto } from './dto/create-fee-component.dto';
import { UpdateFeeComponentDto } from './dto/update-fee-component.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('fee-components')
@UseGuards(TenantAuthGuard)
export class FeeComponentsController {
  constructor(private readonly feeComponentsService: FeeComponentsService) {}

  @Post()
  async create(
    @Body() dto: CreateFeeComponentDto, 
    @CurrentCampus() campusId: string
  ) {
    return this.feeComponentsService.create(dto, campusId);
  }

  @Get()
  async findAll(@CurrentCampus() campusId: string) {
    return this.feeComponentsService.findAll(campusId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentCampus() campusId: string) {
    return this.feeComponentsService.findOne(id, campusId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateFeeComponentDto, 
    @CurrentCampus() campusId: string
  ) {
    return this.feeComponentsService.update(id, dto, campusId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentCampus() campusId: string) {
    return this.feeComponentsService.remove(id, campusId);
  }
}