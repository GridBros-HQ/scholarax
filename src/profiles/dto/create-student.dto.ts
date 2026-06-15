import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsUUID()
  @IsNotEmpty()
  guardianId: string;

  @IsUUID()
  @IsNotEmpty()
  streamId: string;
}
