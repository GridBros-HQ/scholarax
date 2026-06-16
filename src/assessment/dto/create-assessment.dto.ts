import { IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { AssessmentType } from '@prisma/client';

export class CreateAssessmentDto {
  @IsNotEmpty()
  @IsString()
  academicYearId: string;

  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsEnum(AssessmentType)
  type: AssessmentType;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxPoints: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightPercentage: number;
}