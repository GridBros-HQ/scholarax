import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreamDto } from './dto/create-stream.dto';

@Injectable()
export class StreamsService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔑 Added campusId requirement to block hidden data boundaries
  async create(dto: CreateStreamDto, campusId: string) {
    // 🛡️ 1. Replaced findUnique with findFirst to ensure parent class belongs to this tenant scope
    const parentClass = await this.prisma['class'].findFirst({
      where: { 
        id: dto.classId,
        campus_id: campusId 
      },
    });
    
    if (!parentClass) {
      throw new NotFoundException(`Parent Class with ID ${dto.classId} not found on this campus.`);
    }

    // 2. Create the stream and link its mandatory tenant relationships securely
    return this.prisma['stream'].create({
      data: {
        name: dto.name,
        capacity: dto.capacity, // Maps the numerical limit to the database
        class: {
          connect: { id: dto.classId }
        },
        campus: {
          connect: { id: campusId } // 🔄 FIXED: Securely connected to incoming tenant scope
        }
      },
    });
  }

  // 🛡️ Filtered streams down strictly to the active school
  async findAll(campusId: string) {
    return this.prisma['stream'].findMany({
      where: { campus_id: campusId },
      include: { class: true } // Automatically embeds parent class details in the response
    });
  }
}