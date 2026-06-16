import { PartialType } from '@nestjs/mapped-types';
import { CreateTimetableSlotDto } from './create-timetable-slot.dto';

export class UpdateTimetableDto extends PartialType(CreateTimetableSlotDto) {}