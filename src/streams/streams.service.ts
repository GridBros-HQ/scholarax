import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreamDto } from './dto/create-stream.dto';

@Injectable()
export class StreamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStreamDto) {
    // 1. Ensure the parent class exists first
    const parentClass = await this.prisma['class'].findUnique({
      where: { id: dto.classId },
    });
    if (!parentClass) {
      throw new NotFoundException(`Parent Class with ID ${dto.classId} not found`);
    }

    // 2. Create the stream and link its mandatory relationships
    return this.prisma['stream'].create({
      data: {
        name: dto.name,
        capacity: dto.capacity, // Maps the numerical limit to the database
        class: {
          connect: { id: dto.classId }
        },
        campus: {
          connect: { id: "10000000-0000-0000-0000-000000000001" } // Connects to active campus partition
        }
      },
    });
  }

  async findAll() {
    return this.prisma['stream'].findMany({
      include: { class: true } // Automatically embeds parent class details in the response
    });
  }
}