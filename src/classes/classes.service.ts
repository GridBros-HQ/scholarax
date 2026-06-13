import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassDto) {
    // Our multi-tenant Prisma Service proxy automatically appends the active campus_id
    return this.prisma['class'].create({
      data: {
        name: dto.name,
        track_type: dto.track_type as any,
        campus: {
        connect: { id: "10000000-0000-0000-0000-000000000001" } // Satisfies Prisma's mandatory schema relation
      }
      },
    });
  }

  async findAll() {
    return this.prisma['class'].findMany();
  }

  async findOne(id: string) {
    const classRecord = await this.prisma['class'].findUnique({
      where: { id },
    });
    if (!classRecord) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return classRecord;
  }
}