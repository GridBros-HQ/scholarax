import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., "2026 - Term 1"

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}