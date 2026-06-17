import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class InterpretGradeDto {
  @IsString()
  @IsNotEmpty({ message: 'curriculumType is required ("CBC" or "KCSE")' })
  curriculumType: 'CBC' | 'KCSE';

  @IsNumber({}, { message: 'percentageScore must be a valid number' })
  @Min(0, { message: 'Percentage score cannot be less than 0' })
  @Max(100, { message: 'Percentage score cannot exceed 100' })
  percentageScore: number;
}