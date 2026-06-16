import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTimetableSlotDto, campusId: string) {
    // 1. Fetch all existing active slots for this specific day and tenant campus
    const existingSlots = await this.prisma['timetableSlot'].findMany({
      where: {
        campusId,
        dayOfWeek: dto.dayOfWeek,
      },
    });

    // 2. Loop and check for overlapping time blocks
    for (const slot of existingSlots) {
      const isOverlapping = dto.startTime < slot.endTime && dto.endTime > slot.startTime;

      if (isOverlapping) {
        // Condition A: Verify the teacher isn't double-booked
        if (slot.teacherId === dto.teacherId) {
          throw new ConflictException(
            `Scheduling Collision: Teacher is already assigned to another class from ${slot.startTime} to ${slot.endTime}.`
          );
        }

        // Condition B: Verify the stream/classroom isn't double-booked
        if (slot.streamId === dto.streamId) {
          throw new ConflictException(
            `Scheduling Collision: Stream/Class room is already booked for another subject from ${slot.startTime} to ${slot.endTime}.`
          );
        }
      }
    }

    // 3. No collisions found -> Safely commit the allocation to database memory
    return this.prisma['timetableSlot'].create({
      data: {
        ...dto,
        campusId,
      },
    });
  }

  async findByStream(streamId: string, campusId: string) {
    return this.prisma['timetableSlot'].findMany({
      where: {
        streamId,
        campusId,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }
}