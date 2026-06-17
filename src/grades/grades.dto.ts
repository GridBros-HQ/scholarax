import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsString, 
  IsUUID, 
  Min, 
  ValidateNested 
} from 'class-validator';

export class GradeRecordEntryDto {
  @IsUUID('4', { message: 'Each studentId must be a valid UUIDv4 string' })
  @IsNotEmpty({ message: 'studentId is required' })
  studentId: string;

  @IsNumber({}, { message: 'Score must be a valid decimal number' })
  @Min(0, { message: 'Score cannot be a negative value' })
  score: number;

  @IsString({ message: 'Remarks must be text strings' })
  @IsOptional()
  remarks?: string;
}

export class CreateBulkGradesDto {
  @IsUUID('4', { message: 'assessmentId must be a valid UUIDv4 string' })
  @IsNotEmpty({ message: 'assessmentId is required' })
  assessmentId: string;

  @IsArray({ message: 'records must be a structured list array' })
  @ValidateNested({ each: true })
  @Type(() => GradeRecordEntryDto)
  records: GradeRecordEntryDto[];
}