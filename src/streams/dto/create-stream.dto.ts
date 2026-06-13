import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateStreamDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., "Alpha Stream"

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  capacity: number; // e.g., 40 (max students allowed in this stream)
}