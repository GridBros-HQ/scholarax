import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  async create(@Body() dto: CreateAssessmentDto) {
    const mockCampusId = "10000000-0000-0000-0000-000000000001";
    return this.assessmentService.create(dto, mockCampusId);
  }

  @Get('subject/:subjectId')
  async findBySubject(@Param('subjectId') subjectId: string) {
    const mockCampusId = "10000000-0000-0000-0000-000000000001";
    return this.assessmentService.findBySubject(subjectId, mockCampusId);
  }
}