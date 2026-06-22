import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1, { message: 'Expense amount must be greater than 0.' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  category: string; // e.g., 'Utilities', 'Supplies', 'Maintenance', 'Payroll'

  @IsString()
  @IsOptional()
  referenceNumber?: string; // Voucher or receipt numbers
}