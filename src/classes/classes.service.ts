import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔑 Added campusId to the method arguments
  async create(dto: CreateClassDto, campusId: string) {
    return this.prisma['class'].create({
      data: {
        name: dto.name,
        track_type: dto.track_type as any,
        campus: {
          connect: { id: campusId } // 🔄 FIXED: No longer pinning every classroom to a dev test stub
        }
      },
    });
  }

  // 🛡️ Scoped to prevent cross-tenant leakages
  async findAll(campusId: string) {
    return this.prisma['class'].findMany({
      where: { campus_id: campusId },
      orderBy: { name: 'asc' }
    });
  }

  // 🛡️ Replaced findUnique with findFirst to guarantee multi-tenant security verification
  async findOne(id: string, campusId: string) {
    const classRecord = await this.prisma['class'].findFirst({
      where: { 
        id, 
        campus_id: campusId // Ensures a user cannot scrape another school's class data by guessing UUIDs
      },
    });
    
    if (!classRecord) {
      throw new NotFoundException(`Class with ID ${id} not found on this campus.`);
    }
    return classRecord;
  }
}