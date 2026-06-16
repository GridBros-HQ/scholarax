import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async create(@Body() dto: CreateTimetableSlotDto) {
    // Hardcoded global system mock tenant boundary for local development validation
    const mockCampusId = "10000000-0000-0000-0000-000000000001";
    return this.timetableService.create(dto, mockCampusId);
  }

  @Get('stream/:streamId')
  async findByStream(@Param('streamId') streamId: string) {
    const mockCampusId = "10000000-0000-0000-0000-000000000001";
    return this.timetableService.findByStream(streamId, mockCampusId);
  }
}