import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeComponentDto } from './dto/create-fee-component.dto';
import { UpdateFeeComponentDto } from './dto/update-fee-component.dto';

@Injectable()
export class FeeComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeeComponentDto, campusId: string) {
    return this.prisma['feeComponent'].create({
      data: {
        ...dto,
        campusId,
      },
    });
  }

  async findAll(campusId: string) {
    return this.prisma['feeComponent'].findMany({
      where: { campusId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, campusId: string) {
    const component = await this.prisma['feeComponent'].findFirst({
      where: { id, campusId },
    });

    if (!component) {
      throw new NotFoundException(`Fee component tracking record with ID "${id}" not found.`);
    }

    return component;
  }

  async update(id: string, dto: UpdateFeeComponentDto, campusId: string) {
    await this.findOne(id, campusId);

    return this.prisma['feeComponent'].update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, campusId: string) {
    await this.findOne(id, campusId);

    return this.prisma['feeComponent'].delete({
      where: { id },
    });
  }
}