import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateStaffProfileDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  contactString!: string;

  @IsString()
  @IsOptional()
  phoneExtension?: string;

  // Additional fields standard to staff creation might go here
  @IsString()
  @IsOptional()
  employeeCode?: string;

  @IsString()
  @IsOptional()
  designation?: string;
}
