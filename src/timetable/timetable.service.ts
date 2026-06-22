import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTimetableSlotDto, campusId: string) {
    // 1. Resolve active database model dynamically using bracket notation
    const modelName = ['timetableSlot', 'timetable_slot', 'TimetableSlot', 'timetableSlots', 'timetable_slots']
      .find(model => typeof this.prisma[model] !== 'undefined');

    if (!modelName) {
      throw new NotFoundException('Timetable storage mapping configuration reference not found.');
    }

    // 2. Fetch active slots for this specific day and tenant campus using casing fallbacks
    let existingSlots = [];
    try {
      existingSlots = await this.prisma[modelName].findMany({
        where: { campusId, dayOfWeek: dto.dayOfWeek },
      });
    } catch {
      try {
        existingSlots = await this.prisma[modelName].findMany({
          where: { campus_id: campusId, day_of_week: dto.dayOfWeek },
        });
      } catch (err) {
        existingSlots = [];
      }
    }

    // 3. Loop and verify overlapping time slots across both casing conventions
    for (const slot of existingSlots) {
      const slotStartTime = slot.startTime ?? slot.start_time;
      const slotEndTime = slot.endTime ?? slot.end_time;
      const slotTeacherId = slot.teacherId ?? slot.teacher_id;
      const slotStreamId = slot.streamId ?? slot.stream_id;

      const isOverlapping = dto.startTime < slotEndTime && dto.endTime > slotStartTime;

      if (isOverlapping) {
        // Condition A: Verify the teacher isn't double-booked
        if (slotTeacherId === dto.teacherId) {
          throw new ConflictException(
            `Scheduling Collision: Teacher is already assigned to another class from ${slotStartTime} to ${slotEndTime}.`
          );
        }

        // Condition B: Verify the stream/classroom isn't double-booked
        if (slotStreamId === dto.streamId) {
          throw new ConflictException(
            `Scheduling Collision: Stream/Class room is already booked for another subject from ${slotStartTime} to ${slotEndTime}.`
          );
        }
      }
    }

    // 4. No collisions found -> Safely commit the record to the database
    try {
      return await this.prisma[modelName].create({
        data: {
          ...dto,
          campusId,
        },
      });
    } catch (err: any) {
      // Fallback if Benedict's layout enforces strict snake_case properties at database level
      if (err.message?.includes('Unknown argument') || err.code === 'P2025') {
        const rawDto = dto as any;
        return await this.prisma[modelName].create({
          data: {
            campus_id: campusId,
            stream_id: dto.streamId,
            teacher_id: dto.teacherId,
            subject_id: rawDto.subjectId ?? rawDto.subject_id,
            day_of_week: dto.dayOfWeek,
            start_time: dto.startTime,
            end_time: dto.endTime,
            room_id: rawDto.roomId ?? rawDto.room_id,
          },
        });
      }
      throw err;
    }
  }

  async findByStream(streamId: string, campusId: string) {
    const modelName = ['timetableSlot', 'timetable_slot', 'TimetableSlot', 'timetableSlots', 'timetable_slots']
      .find(model => typeof this.prisma[model] !== 'undefined');

    if (!modelName) {
      throw new NotFoundException('Timetable storage mapping configuration reference not found.');
    }

    try {
      // Strategy A: Query using camelCase database parameters
      return await this.prisma[modelName].findMany({
        where: { streamId, campusId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
      });
    } catch {
      try {
        // Strategy B: Query using snake_case database parameters
        const dbRecords = await this.prisma[modelName].findMany({
          where: { stream_id: streamId, campus_id: campusId },
          orderBy: [
            { day_of_week: 'asc' },
            { start_time: 'asc' },
          ],
        });

        // Normalize output object shape for frontend consistency
        return dbRecords.map((slot: any) => ({
          id: slot.id,
          campusId: slot.campus_id ?? slot.campusId,
          streamId: slot.stream_id ?? slot.streamId,
          teacherId: slot.teacher_id ?? slot.teacherId,
          subjectId: slot.subject_id ?? slot.subjectId,
          dayOfWeek: slot.day_of_week ?? slot.dayOfWeek,
          startTime: slot.start_time ?? slot.startTime,
          endTime: slot.end_time ?? slot.endTime,
          createdAt: slot.created_at ?? slot.createdAt,
          updatedAt: slot.updated_at ?? slot.updatedAt,
        }));
      } catch (err) {
        return [];
      }
    }
  }
}