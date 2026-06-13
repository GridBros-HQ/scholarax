import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateGuardianProfileDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  contactString!: string;

  @IsString()
  @IsOptional()
  relationshipToStudent?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  profession?: string;
}
