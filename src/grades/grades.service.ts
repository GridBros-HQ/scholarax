import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async recordBulkGrades(dto: CreateBulkGradesDto, campusId: string) {
    const { assessmentId, records } = dto;

    const assessment = await this.prisma.client.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.campus_id !== campusId) {
      throw new BadRequestException('Assessment does not belong to this campus');
    }

    for (const record of records) {
      if (record.score > assessment.maxPoints) {
        throw new BadRequestException(
          `Score ${record.score} for student ${record.studentId} exceeds maximum points ${assessment.maxPoints}`,
        );
      }
    }

    return this.prisma.client.$transaction(async (tx) => {
      for (const record of records) {
        const student = await tx.student.findFirst({
          where: {
            id: record.studentId,
            campus_id: campusId,
          },
        });

        if (!student) {
          throw new BadRequestException(
            `Student ${record.studentId} not found or does not belong to this campus`,
          );
        }

        await tx.gradeRecord.upsert({
          where: {
            student_assessment_unique_idx: {
              studentId: record.studentId,
              assessmentId: assessmentId,
            },
          },
          update: {
            score: record.score,
            remarks: record.remarks,
          },
          create: {
            campusId: campusId,
            studentId: record.studentId,
            assessmentId: assessmentId,
            score: record.score,
            remarks: record.remarks,
          },
        });
      }
      return { message: 'Bulk grades recorded successfully' };
    });
  }

  async getStudentReportCard(studentId: string, campusId: string) {
    const records = await this.prisma.client.gradeRecord.findMany({
      where: {
        studentId: studentId,
        campusId: campusId,
      },
      include: {
        assessment: {
          include: {
            subject: true,
          },
        },
      },
    });

    return records.map((record) => {
      const percentageGrade = (record.score / record.assessment.maxPoints) * 100;
      return {
        ...record,
        percentageGrade,
      };
    });
  }
}
