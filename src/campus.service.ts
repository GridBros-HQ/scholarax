import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CreateCampusDto } from './create-campus.dto';

@Injectable()
export class CampusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCampusDto: CreateCampusDto) {
    return this.prisma.client.campus.create({
      data: createCampusDto,
    });
  }

  async findAll() {
    return this.prisma.client.campus.findMany();
  }
}