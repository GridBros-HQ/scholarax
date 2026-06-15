import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicYearDto) {
    return this.prisma['academicYear'].create({
      data: {
        name: dto.name,
        start_date: new Date(dto.startDate),
        end_date: new Date(dto.endDate),
        is_active: true, // Sets term to operational by default
        campus: {
          connect: { id: "10000000-0000-0000-0000-000000000001" }
        }
      },
    });
  }

  async findAll() {
    return this.prisma['academicYear'].findMany();
  }
}