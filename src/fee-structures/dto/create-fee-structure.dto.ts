import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateFeeStructureDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID('4')
  academicYearId: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  componentIds: string[];
}