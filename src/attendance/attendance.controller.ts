import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateBulkAttendanceDto } from './dto/create-bulk-attendance.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('api/attendance')
@UseGuards(TenantAuthGuard) // 🛡️ Secure all tracking metrics under the multi-tenant shield
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Note: Manual validateCampusId header checks have been entirely removed.
  // The TenantAuthGuard automatically guarantees token existence and cryptographic validity.

  @Post('bulk')
  async recordBulkAttendance(
    @Body() dto: CreateBulkAttendanceDto,
    @CurrentCampus() campusId: string, // 🔑 Header parsing replaced with secure parameter injection
  ) {
    return this.attendanceService.recordBulkAttendance(dto, campusId);
  }

  @Get('student/:studentId')
  async getStudentHistory(
    @Param('studentId', new ParseUUIDPipe({ version: '4' })) studentId: string,
    @CurrentCampus() campusId: string,
  ) {
    return this.attendanceService.getStudentHistory(studentId, campusId);
  }

  @Get('metrics')
  async getCampusMetrics(@CurrentCampus() campusId: string) {
    return this.attendanceService.getCampusMetrics(campusId);
  }
}