import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInvoiceRunDto {
  @IsNotEmpty()
  @IsUUID('4')
  feePackageId: string;

  @IsNotEmpty()
  @IsUUID('4')
  termId: string;

  @IsNotEmpty()
  @IsUUID('4')
  classId: string;
}