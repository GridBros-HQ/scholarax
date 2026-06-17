import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('subjects')
@UseGuards(TenantAuthGuard) // 🛡️ Secures curriculum structures across individual tenants
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(
    @Body() dto: CreateSubjectDto, 
    @CurrentCampus() campusId: string, // 🔑 Request parameters cleaned of manual parsing scripts
  ) {
    return this.subjectsService.create(dto, campusId);
  }

  @Get()
  findAll(@CurrentCampus() campusId: string) {
    return this.subjectsService.findAll(campusId);
  }
}