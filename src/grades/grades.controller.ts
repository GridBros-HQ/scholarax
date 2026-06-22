import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  ParseUUIDPipe, 
  Post, 
  Query,
  HttpCode, 
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';
import { GradesService } from './grades.service';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('grades')
@UseGuards(TenantAuthGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(
    @CurrentCampus() campusId: string,
    @Body() createBulkGradesDto: CreateBulkGradesDto,
  ) {
    return this.gradesService.ingestBulkGrades(campusId, createBulkGradesDto);
  }

  @Get('student/:studentId')
  @HttpCode(HttpStatus.OK)
  async getStudentSheet(
    @CurrentCampus() campusId: string,
    @Param('studentId', new ParseUUIDPipe({ version: '4' })) studentId: string,
  ) {
    return this.gradesService.getStudentGradeSheet(campusId, studentId);
  }

  @Get('report-card/student/:studentId/term/:termId')
  @HttpCode(HttpStatus.OK)
  async getTerminalReportCard(
    @CurrentCampus() campusId: string,
    @Param('studentId', new ParseUUIDPipe({ version: '4' })) studentId: string,
    @Param('termId', new ParseUUIDPipe({ version: '4' })) termId: string,
    @Query('curriculum') curriculum: 'CBC' | 'KCSE' = 'KCSE',
  ) {
    return this.gradesService.generateTerminalReportCard(campusId, studentId, termId, curriculum);
  }
}