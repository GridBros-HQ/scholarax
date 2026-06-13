import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CurriculumType } from '@prisma/client';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., "Grade 10 Senior Science"

  @IsEnum(CurriculumType)
  @IsNotEmpty()
  track_type: CurriculumType;
}