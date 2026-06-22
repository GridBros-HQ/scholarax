import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import { InterpretGradeDto } from './dto/interpret-grade.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('grading-scale')
@UseGuards(TenantAuthGuard)
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  @Post('interpret')
  @HttpCode(HttpStatus.OK)
  async interpretGrade(
    @CurrentCampus() campusId: string,
    @Body() dto: InterpretGradeDto,
  ) {
    return this.gradingScaleService.interpretScore(
      campusId,
      dto.curriculumType,
      dto.percentageScore,
    );
  }
}