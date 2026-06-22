import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('subjects')
@UseGuards(TenantAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateSubjectDto, 
    @CurrentCampus() campusId: string,
  ) {
    return this.subjectsService.create(dto, campusId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentCampus() campusId: string) {
    return this.subjectsService.findAll(campusId);
  }
}