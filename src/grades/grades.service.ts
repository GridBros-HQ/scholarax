import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically upserts bulk marks arrays under a safe transactional stream
   */
  async ingestBulkGrades(campusId: string, dto: CreateBulkGradesDto) {
    const db = this.prisma as any;

    // 1. Enforce validation checkpoint on parent assessment rule configuration
    const assessment = await db.assessment.findUnique({
      where: { id: dto.assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Assessment config record with ID "${dto.assessmentId}" not found.`
      );
    }

    // 2. Validate grade ceiling boundaries against database parameters
    const ceilingLimit = assessment.maxPoints;
    for (const record of dto.records) {
      if (record.score > ceilingLimit) {
        throw new BadRequestException(
          `Invalid Entry: Score of ${record.score} cannot exceed the assessment max limit of ${ceilingLimit} points.`
        );
      }
    }

    // 3. Commit elements simultaneously inside an isolated database write stream
    return db.$transaction(async (tx: any) => {
      const operations = dto.records.map((record) => {
        return tx.gradeRecord.upsert({
          where: {
            student_assessment_unique_idx: {
              studentId: record.studentId,
              assessmentId: dto.assessmentId,
            },
          },
          update: {
            score: record.score,
            remarks: record.remarks,
          },
          create: {
            campusId: campusId,
            studentId: record.studentId,
            assessmentId: dto.assessmentId,
            score: record.score,
            remarks: record.remarks,
          },
        });
      });

      return Promise.all(operations);
    });
  }

  /**
   * Reads, maps, and structures complete transcripts for a target student matching multi-tenant keys
   */
  async getStudentGradeSheet(campusId: string, studentId: string) {
    const db = this.prisma as any;

    const historicalGrades = await db.gradeRecord.findMany({
      where: {
        studentId: studentId,
        campusId: campusId,
      },
      include: {
        assessment: {
          select: {
            title: true,
            type: true,
            maxPoints: true,
            weightPercentage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (historicalGrades.length === 0) {
      return { studentId, records: [] };
    }

    return {
      studentId,
      records: historicalGrades.map((grade: any) => ({
        gradeId: grade.id,
        assessmentId: grade.assessmentId,
        assessmentTitle: grade.assessment.title,
        assessmentType: grade.assessment.type,
        scoreObtained: grade.score,
        maxPossiblePoints: grade.assessment.maxPoints,
        weightageContribution: grade.assessment.weightPercentage,
        remarks: grade.remarks,
        recordedAt: grade.createdAt,
      })),
    };
  }
}