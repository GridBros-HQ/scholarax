import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('academic-years')
@UseGuards(TenantAuthGuard) // 🛡️ Replaced legacy single-tenant guard
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  create(
    @Body() dto: CreateAcademicYearDto,
    @CurrentCampus() campusId: string, // 🔑 Securely injected from cryptographic JWT token
  ) {
    return this.academicYearsService.create(dto, campusId);
  }

  @Get()
  findAll(@CurrentCampus() campusId: string) {
    return this.academicYearsService.findAll(campusId);
  }
}