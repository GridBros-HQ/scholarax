import { 
  Body, 
  Controller, 
  Get, 
  Headers, 
  Param, 
  ParseUUIDPipe, 
  Post, 
  BadRequestException, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';
import { GradesService } from './grades.service';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(
    @Headers('x-campus-id') campusId: string,
    @Body() createBulkGradesDto: CreateBulkGradesDto,
  ) {
    if (!campusId) {
      throw new BadRequestException('Missing mandatory x-campus-id tenant header');
    }
    return this.gradesService.ingestBulkGrades(campusId, createBulkGradesDto);
  }

  @Get('student/:studentId')
  async getStudentSheet(
    @Headers('x-campus-id') campusId: string,
    @Param('studentId', new ParseUUIDPipe({ version: '4' })) studentId: string,
  ) {
    if (!campusId) {
      throw new BadRequestException('Missing mandatory x-campus-id tenant header');
    }
    return this.gradesService.getStudentGradeSheet(campusId, studentId);
  }
}