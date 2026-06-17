import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('timetable')
@UseGuards(TenantAuthGuard) // 🛡️ Protects all timetable allocations from multi-tenant data leaks
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  async create(
    @Body() dto: CreateTimetableSlotDto,
    @CurrentCampus() campusId: string // 🔑 Extracted directly from cryptographically verified user tokens
  ) {
    return this.timetableService.create(dto, campusId);
  }

  @Get('stream/:streamId')
  async findByStream(
    @Param('streamId') streamId: string,
    @CurrentCampus() campusId: string // 🔑 Extracted directly from cryptographically verified user tokens
  ) {
    return this.timetableService.findByStream(streamId, campusId);
  }
}