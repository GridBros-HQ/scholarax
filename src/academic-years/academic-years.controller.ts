import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('academic-years')
@UseGuards(JwtAuthGuard)
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  create(@Body() dto: CreateAcademicYearDto) {
    return this.academicYearsService.create(dto);
  }

  @Get()
  findAll() {
    return this.academicYearsService.findAll();
  }
}