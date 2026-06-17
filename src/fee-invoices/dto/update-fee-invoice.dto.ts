import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceRunDto } from './create-fee-invoice.dto';

export class UpdateFeeInvoiceDto extends PartialType(CreateInvoiceRunDto) {}