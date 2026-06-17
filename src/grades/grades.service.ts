import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async ingestBulkGrades(campusId: string, dto: CreateBulkGradesDto) {
    const db = this.prisma as any;

    // 1. Dynamic lookup for the Assessment model config
    const assessmentModel = db.assessment || db.assessment_config || db.Assessment || db.assessmentConfig;
    if (!assessmentModel) {
      throw new NotFoundException('Assessment data model reference not found in active client.');
    }

    const assessment = await assessmentModel.findUnique({
      where: { id: dto.assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Assessment config record with ID "${dto.assessmentId}" not found.`
      );
    }

    // 2. Validate grade ceiling boundaries
    const ceilingLimit = assessment.maxPoints;
    for (const record of dto.records) {
      if (record.score > ceilingLimit) {
        throw new BadRequestException(
          `Invalid Entry: Score of ${record.score} cannot exceed the assessment max limit of ${ceilingLimit} points.`
        );
      }
    }

    // 3. Commit elements using a multi-style resolution strategy
    return db.$transaction(async (tx: any) => {
      // Expanded search chain matching Benedict's potential schema changes
      const gradeModel = tx.gradeRecord || tx.grade_record || tx.GradeRecord || tx.gradeRecords || tx.grade_records || tx.grade || tx.grades;

      if (!gradeModel) {
        // Safe extraction from plain-object metadata to completely bypass Proxy invariant traps
        const metadataModels = Object.keys(db._runtimeDataModel?.models || db._dmmf?.modelMap || {});
        throw new BadRequestException(
          `Prisma client model mismatch after merge. Tested variations but found none. Available models in your current schema are: [${metadataModels.join(', ')}]`
        );
      }

      const operations = dto.records.map(async (record) => {
        try {
          // Attempt upsert with standard unique compound index
          return await gradeModel.upsert({
            where: {
              student_assessment_unique_idx: {
                studentId: record.studentId,
                assessmentId: dto.assessmentId,
              },
            },
            update: { score: record.score, remarks: record.remarks },
            create: {
              campusId: campusId,
              studentId: record.studentId,
              assessmentId: dto.assessmentId,
              score: record.score,
              remarks: record.remarks,
            },
          });
        } catch (err: any) {
          // Fallback if Benedict shifted the unique indexes to strict snake_case layouts
          if (err.message?.includes('Unknown argument') || err.code === 'P2025') {
            return await gradeModel.upsert({
              where: {
                student_id_assessment_id_unique_idx: {
                  student_id: record.studentId,
                  assessment_id: dto.assessmentId,
                },
              },
              update: { score: record.score, remarks: record.remarks },
              create: {
                campus_id: campusId,
                student_id: record.studentId,
                assessment_id: dto.assessmentId,
                score: record.score,
                remarks: record.remarks,
              },
            });
          }
          throw err;
        }
      });

      return Promise.all(operations);
    });
  }

  async getStudentGradeSheet(campusId: string, studentId: string) {
    const db = this.prisma as any;
    const gradeModel = db.gradeRecord || db.grade_record || db.GradeRecord || db.gradeRecords || db.grade_records || db.grade || db.grades;

    if (!gradeModel) {
      throw new NotFoundException('Grade record database layout mapping configuration is missing.');
    }

    let historicalGrades = [];
    try {
      historicalGrades = await gradeModel.findMany({
        where: { studentId: studentId, campusId: campusId },
        include: { assessment: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      try {
        historicalGrades = await gradeModel.findMany({
          where: { student_id: studentId, campus_id: campusId },
          include: { assessment: true },
          orderBy: { created_at: 'desc' },
        });
      } catch (err) {}
    }

    return {
      studentId,
      records: historicalGrades.map((grade: any) => ({
        gradeId: grade.id,
        assessmentId: grade.assessmentId || grade.assessment_id,
        assessmentTitle: grade.assessment?.title || 'Unknown Assessment',
        assessmentType: grade.assessment?.type || 'EXAM',
        scoreObtained: grade.score,
        maxPossiblePoints: grade.assessment?.maxPoints || 100,
        weightageContribution: grade.assessment?.weightPercentage || 0,
        remarks: grade.remarks,
        recordedAt: grade.createdAt || grade.created_at,
      })),
    };
  }
}