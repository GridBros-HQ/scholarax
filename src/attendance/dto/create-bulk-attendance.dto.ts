import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class IndividualAttendanceDto {
  @IsNotEmpty()
  @IsUUID('4')
  studentId: string;

  @IsEnum(AttendanceStatus, {
    message: 'status must be a valid enum value: PRESENT, ABSENT, LATE, EXCUSED',
  })
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateBulkAttendanceDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndividualAttendanceDto)
  records: IndividualAttendanceDto[];
}
