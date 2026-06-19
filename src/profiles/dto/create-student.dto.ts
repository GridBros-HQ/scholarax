import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsUUID('4')
  @IsNotEmpty()
  streamId: string;

  @IsUUID('4')
  @IsNotEmpty()
  guardianId: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string; // Expects an ISO date string format (e.g., "2012-05-14")

  @IsNotEmpty()
  @IsString()
  gender: string; // Must match your exact Prisma schema capitalization (e.g., "MALE", "FEMALE")
}