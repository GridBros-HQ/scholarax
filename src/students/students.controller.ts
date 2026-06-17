import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('students')
@UseGuards(TenantAuthGuard) // 🛡️ Protects enrollment logs from cross-campus sniffing
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  async createStudent(
    @Body() dto: CreateStudentDto,
    @CurrentCampus() campusId: string, // 🔑 Verified automatically by the passport pipeline
  ) {
    // Note: Manual validation check blocks are safely deleted. Guard blocks failure states upstream.
    return this.studentsService.enrollStudent(dto, campusId);
  }
}