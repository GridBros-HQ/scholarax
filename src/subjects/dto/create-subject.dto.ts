import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., "Physics"

  @IsString()
  @IsNotEmpty()
  code: string; // e.g., "PHYS-G11"

  @IsString()
  @IsNotEmpty()
  curriculumType: string; // e.g., "NATIONAL", "CBC", or "IGCSE"
}