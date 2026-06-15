import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  admissionNumber: string;

  @IsUUID('4')
  streamId: string;

  @IsUUID('4')
  guardianId: string;
}
