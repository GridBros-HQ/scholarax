import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssessmentDto, campusId: string) {
    // 1. Total Weight Validation Check per Subject
    // Ensure the combined allocations for this subject track do not exceed 100%
    const existingWeight = await this.prisma['assessment'].aggregate({
      where: {
        campusId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
      },
      _sum: {
        weightPercentage: true,
      },
    });

    const currentTotal = existingWeight._sum.weightPercentage || 0;
    if (currentTotal + dto.weightPercentage > 100) {
      throw new BadRequestException(
        `Configuration Overload: Current combined assessment weights for this subject total ${currentTotal}%. Adding this assessment (${dto.weightPercentage}%) exceeds the 100% threshold limit.`
      );
    }

    // 2. Commit configuration cleanly to the database
    return this.prisma['assessment'].create({
      data: {
        ...dto,
        campusId,
      },
    });
  }

  async findBySubject(subjectId: string, campusId: string) {
    return this.prisma['assessment'].findMany({
      where: {
        subjectId,
        campusId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}