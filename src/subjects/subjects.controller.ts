import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(@Body() dto: CreateSubjectDto, @Req() req: any) {
    // Dynamically pulls the campus context set by your global multi-tenant validation pipeline
    const campusId = req.campusId || req.headers['x-campus-id'];
    return this.subjectsService.create(dto, campusId);
  }

  @Get()
  findAll(@Req() req: any) {
    const campusId = req.campusId || req.headers['x-campus-id'];
    return this.subjectsService.findAll(campusId);
  }
}