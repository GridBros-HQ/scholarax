import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreamDto } from './dto/create-stream.dto';

@Injectable()
export class StreamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStreamDto, campusId: string) {
    const classModelName = ['class', 'Class', 'classes', 'ClassRecord']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'class';
    const streamModelName = ['stream', 'Stream', 'streams']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'stream';

    // 1. Verify parent class context with casing fallback rules
    let parentClass = null;
    try {
      parentClass = await this.prisma[classModelName].findFirst({
        where: { id: dto.classId, campusId: campusId },
      });
    } catch {
      parentClass = await this.prisma[classModelName].findFirst({
        where: { id: dto.classId, campus_id: campusId },
      });
    }

    if (!parentClass) {
      throw new NotFoundException(`Parent Class structural mapping reference not found on this campus.`);
    }

    // 2. Safely write stream record to table memory
    try {
      return await this.prisma[streamModelName].create({
        data: {
          name: dto.name,
          capacity: Number(dto.capacity),
          classId: dto.classId,
          campusId: campusId,
        },
      });
    } catch {
      return await this.prisma[streamModelName].create({
        data: {
          name: dto.name,
          capacity: Number(dto.capacity),
          class_id: dto.classId,
          campus_id: campusId,
        },
      });
    }
  }

  async findAll(campusId: string) {
    const streamModelName = ['stream', 'Stream', 'streams']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'stream';

    try {
      return await this.prisma[streamModelName].findMany({
        where: { campusId: campusId },
        include: { class: true },
      });
    } catch {
      return await this.prisma[streamModelName].findMany({
        where: { campus_id: campusId },
        include: { class: true },
      });
    }
  }
}