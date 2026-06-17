import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  ParseUUIDPipe, 
  Post, 
  HttpCode, 
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';
import { GradesService } from './grades.service';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('grades')
@UseGuards(TenantAuthGuard) // 🛡 Secures all routes in this controller automatically
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(
    @CurrentCampus() campusId: string, // 🔑 Extract securely from cryptographically verified JWT
    @Body() createBulkGradesDto: CreateBulkGradesDto,
  ) {
    // Note: Manual "if (!campusId)" checks are removed. The Guard handles this automatically.
    return this.gradesService.ingestBulkGrades(campusId, createBulkGradesDto);
  }

  @Get('student/:studentId')
  async getStudentSheet(
    @CurrentCampus() campusId: string, // 🔑 Extract securely from cryptographically verified JWT
    @Param('studentId', new ParseUUIDPipe({ version: '4' })) studentId: string,
  ) {
    return this.gradesService.getStudentGradeSheet(campusId, studentId);
  }
}