import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceRunDto } from './dto/create-fee-invoice.dto';

@Injectable()
export class FeeInvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatchRun(dto: CreateInvoiceRunDto, campusId: string) {
    const { feePackageId, termId, classId } = dto;

    const targetPackage = await this.prisma['feePackage'].findFirst({
      where: { id: feePackageId, campusId },
      include: { items: { include: { feeComponent: true } } },
    });

    if (!targetPackage) {
      throw new NotFoundException(`Fee allocation package with ID "${feePackageId}" not found.`);
    }

    const totalInvoiceAmount = targetPackage.items.reduce((sum, item) => {
      return sum + (item.feeComponent?.amount || 0);
    }, 0);

    if (totalInvoiceAmount <= 0) {
      throw new ConflictException('Invoice compilation failed: Target package contains an aggregate valuation of 0.00.');
    }

    const targetStudents = await this.prisma['student'].findMany({
      where: {
        campus_id: campusId,
        stream: {
          class_id: classId,
        },
      },
      select: { id: true },
    });

    if (targetStudents.length === 0) {
      throw new NotFoundException(`No active student registrations found linked to Class ID "${classId}".`);
    }

    return this.prisma['$transaction'](async (tx: any) => {
      const generatedInvoices = [];

      for (const student of targetStudents) {
        const existingInvoice = await tx['feeInvoice'].findFirst({
          where: { student_id: student.id, term_id: termId },
        });

        if (!existingInvoice) {
          const invoice = await tx['feeInvoice'].create({
            data: {
              campus_id: campusId,
              student_id: student.id,
              term_id: termId,
              total_amount: totalInvoiceAmount,
              paid_amount: 0.00,
              status: 'UNPAID',
            },
          });
          generatedInvoices.push(invoice);
        }
      }

      return {
        message: 'Batch invoicing run completed successfully.',
        totalProcessedStudents: targetStudents.length,
        invoicesGenerated: generatedInvoices.length,
        individualInvoiceAmount: totalInvoiceAmount,
      };
    });
  }

  async findAllByCampus(campusId: string) {
    return this.prisma['feeInvoice'].findMany({
      where: { campus_id: campusId },
      orderBy: { created_at: 'desc' },
    });
  }
}