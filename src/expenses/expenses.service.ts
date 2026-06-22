import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // 🎯 Bulletproof absolute import
import { CreateExpenseDto } from 'src/expenses/dto/create-expense.dto'; // 🎯 Bulletproof absolute import

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 📤 Records a new expenditure row against a campus budget ledger
   */
  async createExpense(dto: CreateExpenseDto, campusId: string, userId: string) {
    const modelName = ['expense', 'Expense', 'expenses', 'expenseRecord', 'expense_records']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'expense';

    try {
      // Strategy A: camelCase model field mapping
      return await this.prisma[modelName].create({
        data: {
          title: dto.title,
          description: dto.description,
          amount: dto.amount,
          category: dto.category,
          referenceNumber: dto.referenceNumber,
          campusId: campusId,
          recordedById: userId,
        },
      });
    } catch {
      // Strategy B: snake_case database constraints fallback
      return await this.prisma[modelName].create({
        data: {
          title: dto.title,
          description: dto.description,
          amount: dto.amount,
          category: dto.category,
          reference_number: dto.referenceNumber,
          campus_id: campusId,
          recorded_by_id: userId,
        },
      });
    }
  }

  /**
   * 🔍 Retrieves all outgoing expenses logged on this campus node
   */
  async findAllExpenses(campusId: string) {
    const modelName = ['expense', 'Expense', 'expenses', 'expenseRecord', 'expense_records']
      .find(model => typeof this.prisma[model] !== 'undefined') || 'expense';

    try {
      return await this.prisma[modelName].findMany({
        where: { campusId: campusId },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return await this.prisma[modelName].findMany({
        where: { campus_id: campusId },
        orderBy: { created_at: 'desc' },
      });
    }
  }

  /**
   * 📊 Aggregates cumulative expenditures for net cashflow calculations
   */
  async getExpenseMetrics(campusId: string) {
    const expenses = await this.findAllExpenses(campusId);
    
    const totalOutflow = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    
    // Group expenditures dynamically by operational categories
    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach((exp) => {
      const category = exp.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(exp.amount || 0);
    });

    return {
      totalExpenseOutflow: totalOutflow,
      expenseCount: expenses.length,
      categoryBreakdown,
    };
  }
}