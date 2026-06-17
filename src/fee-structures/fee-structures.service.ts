import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';

@Injectable()
export class FeeStructuresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeeStructureDto, campusId: string) {
    const { name, academicYearId, componentIds } = dto;

    // 1. Run the database insertion steps inside the isolation block
    const createdPackage = await this.prisma['$transaction'](async (tx: any) => {
      const packageHeader = await tx['feePackage'].create({
        data: {
          name,
          academicYearId,
          campusId,
        },
      });

      const itemOperations = componentIds.map((componentId) => {
        return tx['feePackageItem'].create({
          data: {
            feePackageId: packageHeader.id,
            feeComponentId: componentId,
          },
        });
      });

      await Promise.all(itemOperations);
      
      // Return the header data out of the transaction context
      return packageHeader;
    });

    // 2. Query the complete relational layout now that the transaction is committed
    return this.findOne(createdPackage.id, campusId);
  }

  async findAll(campusId: string) {
    return this.prisma['feePackage'].findMany({
      where: { campusId },
      include: {
        items: {
          include: { feeComponent: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, campusId: string) {
    const packageRecord = await this.prisma['feePackage'].findFirst({
      where: { id, campusId },
      include: {
        items: {
          include: { feeComponent: true },
        },
      },
    });

    if (!packageRecord) {
      throw new NotFoundException(`Fee allocation package with ID "${id}" not found.`);
    }

    return packageRecord;
  }
}