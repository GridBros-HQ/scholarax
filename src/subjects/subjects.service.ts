import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubjectDto, campusId: string) {
    const modelName = ['subject', 'Subject', 'subjects']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'subject';

    try {
      // Strategy A: camelCase schema tracking structures
      return await this.prisma[modelName].create({
        data: {
          name: dto.name,
          code: dto.code,
          curriculumType: dto.curriculumType || (dto as any).curriculum_type,
          campusId: campusId,
        },
      });
    } catch {
      // Strategy B: snake_case database constraints fallback
      return await this.prisma[modelName].create({
        data: {
          name: dto.name,
          code: dto.code,
          curriculum_type: dto.curriculumType || (dto as any).curriculum_type,
          campus_id: campusId,
        },
      });
    }
  }

  async findAll(campusId: string) {
    const modelName = ['subject', 'Subject', 'subjects']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'subject';

    try {
      return await this.prisma[modelName].findMany({
        where: { campusId: campusId },
        orderBy: { name: 'asc' },
      });
    } catch {
      return await this.prisma[modelName].findMany({
        where: { campus_id: campusId },
        orderBy: { name: 'asc' },
      });
    }
  }
}