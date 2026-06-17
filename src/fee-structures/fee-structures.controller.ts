import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('fee-structures')
@UseGuards(TenantAuthGuard)
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Post()
  async create(
    @Body() dto: CreateFeeStructureDto, 
    @CurrentCampus() campusId: string
  ) {
    return this.feeStructuresService.create(dto, campusId);
  }

  @Get()
  async findAll(@CurrentCampus() campusId: string) {
    return this.feeStructuresService.findAll(campusId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentCampus() campusId: string) {
    return this.feeStructuresService.findOne(id, campusId);
  }
}