import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('assessment')
@UseGuards(TenantAuthGuard) // 🛡️ Restricts assessment modifications to authenticated school staff
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  async create(
    @Body() dto: CreateAssessmentDto,
    @CurrentCampus() campusId: string // 🔑 Injected safely from verified user token context
  ) {
    return this.assessmentService.create(dto, campusId);
  }

  @Get('subject/:subjectId')
  async findBySubject(
    @Param('subjectId') subjectId: string,
    @CurrentCampus() campusId: string // 🔑 Injected safely from verified user token context
  ) {
    return this.assessmentService.findBySubject(subjectId, campusId);
  }
}