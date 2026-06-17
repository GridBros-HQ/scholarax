import { PartialType } from '@nestjs/mapped-types';
import { CreateFeeComponentDto } from './create-fee-component.dto';

export class UpdateFeeComponentDto extends PartialType(CreateFeeComponentDto) {}