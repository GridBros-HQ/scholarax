import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IndividualGradeDto {
  @IsNotEmpty()
  @IsUUID('4')
  studentId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateBulkGradesDto {
  @IsNotEmpty()
  @IsUUID('4')
  assessmentId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndividualGradeDto)
  records: IndividualGradeDto[];
}
