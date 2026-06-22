import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceRunDto } from './dto/create-fee-invoice.dto';

@Injectable()
export class FeeInvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatchRun(dto: CreateInvoiceRunDto, campusId: string) {
    const { feePackageId, termId, classId } = dto;

    // 1. Fetch package (Uses camelCase 'campusId' per your schema rules)
    const targetPackage = await this.prisma['feePackage'].findFirst({
      where: { id: feePackageId, campusId },
      include: { feePackageItems: { include: { feeComponent: true } } },
    });

    if (!targetPackage) {
      throw new NotFoundException(`Fee allocation package with ID "${feePackageId}" not found.`);
    }

    const totalInvoiceAmount = targetPackage.feePackageItems.reduce((sum, item) => {
      return sum + (item.feeComponent?.amount || 0);
    }, 0);

    if (totalInvoiceAmount <= 0) {
      throw new ConflictException('Invoice compilation failed: Target package contains an aggregate valuation of 0.00.');
    }

    // 2. Fetch Target Students (Uses snake_case 'campus_id')
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
        // 3. Find existing invoice using the correct snake_case 'campus_id'
        const existingInvoice = await tx['feeInvoice'].findFirst({
          where: { 
            student_id: student.id, 
            term_id: termId,
            campus_id: campusId // Corrected from campusId to campus_id
          },
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

  async getDashboardSummary(campusId: string) {
    // 1. Run financial numeric aggregations inside the database engine
    const metrics = await this.prisma['feeInvoice'].aggregate({
      where: { campus_id: campusId },
      _sum: {
        total_amount: true,
        paid_amount: true,
      },
      _count: {
        id: true,
      },
    });

    // 2. Group totals by their active invoice lifecycle status entries
    const statusGroups = await this.prisma['feeInvoice'].groupBy({
      by: ['status'],
      where: { campus_id: campusId },
      _count: {
        id: true,
      },
    });

    // 3. Normalize values and parse decimal fields to standard floating numbers
    const expectedRevenue = Number(metrics._sum.total_amount || 0);
    const collectedFunds = Number(metrics._sum.paid_amount || 0);
    const outstandingArrears = Math.max(0, expectedRevenue - collectedFunds);
    
    const collectionRate = expectedRevenue > 0 
      ? Number(((collectedFunds / expectedRevenue) * 100).toFixed(2)) 
      : 0;

    // 4. Map query response records safely into a clean schema structure
    const statusBreakdown = { UNPAID: 0, PARTIAL: 0, PAID: 0 };
    statusGroups.forEach((group) => {
      if (group.status in statusBreakdown) {
        statusBreakdown[group.status] = group._count.id;
      }
    });

    return {
      summary: {
        totalInvoicesCount: metrics._count.id,
        totalExpectedRevenue: expectedRevenue,
        totalCollectedFunds: collectedFunds,
        totalOutstandingArrears: outstandingArrears,
        collectionRatePercentage: collectionRate,
      },
      breakdown: statusBreakdown,
    };
  }

  async findAllByCampus(campusId: string) {
    return this.prisma['feeInvoice'].findMany({
      where: { campus_id: campusId },
      orderBy: { created_at: 'desc' },
    });
  }
}