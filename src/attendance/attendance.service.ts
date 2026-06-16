import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBulkAttendanceDto } from './dto/create-bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async recordBulkAttendance(dto: CreateBulkAttendanceDto, campusId: string) {
    const { date, records } = dto;
    const attendanceDate = new Date(date);

    return this.prisma.client.$transaction(async (tx) => {
      // For every record in the array, verify the student exists and belongs to the active campusId
      for (const record of records) {
        const student = await tx.student.findFirst({
          where: {
            id: record.studentId,
            campus_id: campusId, // 'campus_id' because Student model does not use @map for this field
          },
        });

        if (!student) {
          throw new BadRequestException(
            `Student with ID ${record.studentId} does not exist or does not belong to this campus`,
          );
        }

        // Upsert matching against the 'studentId_date' unique compound index
        await tx.attendanceRecord.upsert({
          where: {
            student_date_unique_idx: {
              studentId: record.studentId,
              date: attendanceDate,
            },
          },
          update: {
            status: record.status,
            remarks: record.remarks,
          },
          create: {
            campusId: campusId,
            studentId: record.studentId,
            date: attendanceDate,
            status: record.status,
            remarks: record.remarks,
          },
        });
      }

      return { message: 'Bulk attendance recorded successfully' };
    });
  }

  async getStudentHistory(studentId: string, campusId: string) {
    const records = await this.prisma.client.attendanceRecord.findMany({
      where: {
        studentId: studentId,
        campusId: campusId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (records.length === 0) {
      // Check if the student profile exists on the campus
      const student = await this.prisma.client.student.findFirst({
        where: {
          id: studentId,
          campus_id: campusId,
        },
      });

      if (!student) {
        throw new NotFoundException('Student profile not found on this campus');
      }
    }

    return records;
  }

  async getCampusMetrics(campusId: string) {
    // Extract aggregate raw counts restricted to the active campusId
    const groupResults = await this.prisma.client.attendanceRecord.groupBy({
      by: ['status'],
      where: { campusId: campusId },
      _count: {
        _all: true,
      },
    });

    let total = 0;
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    for (const group of groupResults) {
      const count = group._count._all;
      total += count;
      switch (group.status) {
        case 'PRESENT':
          present += count;
          break;
        case 'LATE':
          late += count;
          break;
        case 'ABSENT':
          absent += count;
          break;
        case 'EXCUSED':
          excused += count;
          break;
      }
    }

    const attendanceCount = present + late + excused;
    const truancyCount = absent;

    const overallAttendancePercentage = total === 0 ? 0 : (attendanceCount / total) * 100;
    const truancyRate = total === 0 ? 0 : (truancyCount / total) * 100;

    return {
      totalRecords: total,
      metrics: {
        present,
        late,
        absent,
        excused,
      },
      rates: {
        overallAttendancePercentage,
        truancyRate,
      },
    };
  }
}
