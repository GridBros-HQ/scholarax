import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateGuardianProfileDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  contactString!: string;

  @IsString()
  @IsOptional()
  phoneExtension?: string;

  // Additional fields standard to guardian creation might go here
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;
}
