import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/grades')
@UseGuards(JwtAuthGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  private validateCampusId(campusId?: string): string {
    if (!campusId) {
      throw new BadRequestException('x-campus-id header is required');
    }
    return campusId;
  }

  @Post('bulk')
  async recordBulkGrades(
    @Body() dto: CreateBulkGradesDto,
    @Headers('x-campus-id') campusIdHeader?: string,
  ) {
    const campusId = this.validateCampusId(campusIdHeader);
    return this.gradesService.recordBulkGrades(dto, campusId);
  }

  @Get('student/:studentId')
  async getStudentReportCard(
    @Param('studentId', new ParseUUIDPipe({ version: '4' })) studentId: string,
    @Headers('x-campus-id') campusIdHeader?: string,
  ) {
    const campusId = this.validateCampusId(campusIdHeader);
    return this.gradesService.getStudentReportCard(studentId, campusId);
  }
}
