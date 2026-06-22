import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ExpensesService } from 'src/expenses/expenses.service';
import { CreateExpenseDto } from 'src/expenses/dto/create-expense.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('expenses')
@UseGuards(TenantAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateExpenseDto,
    @CurrentCampus() campusId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.expensesService.createExpense(dto, campusId, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentCampus() campusId: string) {
    return this.expensesService.findAllExpenses(campusId);
  }

  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  async getMetrics(@CurrentCampus() campusId: string) {
    return this.expensesService.getExpenseMetrics(campusId);
  }
}