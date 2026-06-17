import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔑 Added campusId to the method arguments
  async create(dto: CreateAcademicYearDto, campusId: string) {
    return this.prisma['academicYear'].create({
      data: {
        name: dto.name,
        start_date: new Date(dto.startDate),
        end_date: new Date(dto.endDate),
        is_active: true, // Sets term to operational by default
        campus: {
          connect: { id: campusId } // 🔄 FIXED: Dynamically binds to the true tenant token
        }
      },
    });
  }

  // 🛡️ Scoped to enforce tenant data isolation
  async findAll(campusId: string) {
    return this.prisma['academicYear'].findMany({
      where: { campus_id: campusId },
      orderBy: { start_date: 'desc' }
    });
  }
}