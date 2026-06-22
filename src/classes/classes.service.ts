import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassDto, campusId: string) {
    const modelName = ['class', 'Class', 'classes', 'ClassRecord']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'class';

    try {
      // Strategy A: camelCase properties
      return await this.prisma[modelName].create({
        data: {
          name: dto.name,
          trackType: dto.track_type || (dto as any).trackType,
          campusId: campusId,
        },
      });
    } catch {
      // Strategy B: snake_case database constraints fallback
      return await this.prisma[modelName].create({
        data: {
          name: dto.name,
          track_type: dto.track_type || (dto as any).trackType,
          campus_id: campusId,
        },
      });
    }
  }

  async findAll(campusId: string) {
    const modelName = ['class', 'Class', 'classes', 'ClassRecord']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'class';

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

  async findOne(id: string, campusId: string) {
    const modelName = ['class', 'Class', 'classes', 'ClassRecord']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'class';

    let classRecord = null;
    try {
      classRecord = await this.prisma[modelName].findFirst({
        where: { id, campusId: campusId },
      });
    } catch {
      classRecord = await this.prisma[modelName].findFirst({
        where: { id, campus_id: campusId },
      });
    }

    if (!classRecord) {
      throw new NotFoundException(`Class with ID ${id} not found on this campus branch.`);
    }
    return classRecord;
  }
}