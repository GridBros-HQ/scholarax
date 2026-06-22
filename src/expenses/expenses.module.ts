import { Module } from '@nestjs/common';
import { ExpensesService } from 'src/expenses/expenses.service';
import { ExpensesController } from 'src/expenses/expenses.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}