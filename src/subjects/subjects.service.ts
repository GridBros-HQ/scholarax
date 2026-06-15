import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubjectDto, campusId: string) {
    return this.prisma['subject'].create({
      data: {
        name: dto.name,
        code: dto.code,
        curriculum_type: dto.curriculumType, // Maps camelCase API payload to raw DB column name
        campus: {
          connect: { id: campusId }
        }
      },
    });
  }

  async findAll(campusId: string) {
    return this.prisma['subject'].findMany({
      where: { campus_id: campusId },
    });
  }
}