import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async createStudent(
    @Body() dto: CreateStudentDto,
    @Headers('x-campus-id') campusId: string,
  ) {
    if (!campusId) {
      throw new BadRequestException('The x-campus-id header is mandatory');
    }

    return this.studentsService.enrollStudent(dto, campusId);
  }
}
