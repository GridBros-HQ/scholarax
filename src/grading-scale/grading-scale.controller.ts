import { Body, Controller, HttpCode, HttpStatus, Post, Headers, BadRequestException } from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import { InterpretGradeDto } from './dto/interpret-grade.dto';

@Controller('grading-scale')
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  @Post('interpret')
  @HttpCode(HttpStatus.OK)
  async interpretGrade(
    @Headers('x-campus-id') campusId: string,
    @Body() dto: InterpretGradeDto,
  ) {
    if (!campusId) {
      throw new BadRequestException('Missing mandatory x-campus-id multi-tenant header');
    }
    
    return this.gradingScaleService.interpretScore(
      campusId,
      dto.curriculumType,
      dto.percentageScore,
    );
  }
}