import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import { InterpretGradeDto } from './dto/interpret-grade.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('grading-scale')
@UseGuards(TenantAuthGuard) // 🛡️ Restricts engine evaluation routes to authorized school users
export class GradingScaleController {
  constructor(private readonly gradingScaleService: GradingScaleService) {}

  @Post('interpret')
  @HttpCode(HttpStatus.OK)
  async interpretGrade(
    @CurrentCampus() campusId: string, // 🔑 Securely injected from cryptographically validated token context
    @Body() dto: InterpretGradeDto,
  ) {
    // Note: Manual validation block and header checks have been removed safely.
    return this.gradingScaleService.interpretScore(
      campusId,
      dto.curriculumType,
      dto.percentageScore,
    );
  }
}