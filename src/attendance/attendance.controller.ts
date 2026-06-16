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
import { AttendanceService } from './attendance.service';
import { CreateBulkAttendanceDto } from './dto/create-bulk-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  private validateCampusId(campusId?: string): string {
    if (!campusId) {
      throw new BadRequestException('x-campus-id header is required');
    }
    return campusId;
  }

  @Post('bulk')
  async recordBulkAttendance(
    @Body() dto: CreateBulkAttendanceDto,
    @Headers('x-campus-id') campusIdHeader?: string,
  ) {
    const campusId = this.validateCampusId(campusIdHeader);
    return this.attendanceService.recordBulkAttendance(dto, campusId);
  }

  @Get('student/:studentId')
  async getStudentHistory(
    @Param('studentId', new ParseUUIDPipe({ version: '4' })) studentId: string,
    @Headers('x-campus-id') campusIdHeader?: string,
  ) {
    const campusId = this.validateCampusId(campusIdHeader);
    return this.attendanceService.getStudentHistory(studentId, campusId);
  }

  @Get('metrics')
  async getCampusMetrics(@Headers('x-campus-id') campusIdHeader?: string) {
    const campusId = this.validateCampusId(campusIdHeader);
    return this.attendanceService.getCampusMetrics(campusId);
  }
}
