import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBulkGradesDto } from './dto/create-bulk-grades.dto';
import { GradingScaleService } from '../grading-scale/grading-scale.service'; // 🔄 Injected for cross-module mapping

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gradingScaleService: GradingScaleService, // 🛡️ Scale service tracking dependency
  ) {}

  /**
   * 📥 Ingests bulk student performance marks into the database ledger
   */
  async ingestBulkGrades(campusId: string, dto: CreateBulkGradesDto) {
    // 1. Dynamic lookup matching your core bracket-notation architecture
    const assessmentModelName = ['assessment', 'assessment_config', 'Assessment', 'assessmentConfig']
      .find(model => typeof this.prisma[model] !== 'undefined');

    if (!assessmentModelName) {
      throw new NotFoundException('Assessment data model reference not found in active client.');
    }

    const assessment = await this.prisma[assessmentModelName].findUnique({
      where: { id: dto.assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment config record with ID "${dto.assessmentId}" not found.`);
    }

    // 2. Validate grade ceiling boundaries
    const ceilingLimit = assessment.maxPoints || assessment.max_points || 100;
    for (const record of dto.records) {
      if (record.score > ceilingLimit) {
        throw new BadRequestException(
          `Invalid Entry: Score of ${record.score} cannot exceed the assessment max limit of ${ceilingLimit} points.`
        );
      }
    }

    // 3. Commit elements using the standardized transaction allocator
    return this.prisma['$transaction'](async (tx: any) => {
      const gradeModelName = ['gradeRecord', 'grade_record', 'GradeRecord', 'gradeRecords', 'grade_records', 'grade', 'grades']
        .find(model => typeof tx[model] !== 'undefined');

      if (!gradeModelName) {
        const metadataModels = Object.keys(this.prisma['_runtimeDataModel']?.models || this.prisma['_dmmf']?.modelMap || {});
        throw new BadRequestException(
          `Prisma client model mismatch for grading paths. Available models in your current schema are: [${metadataModels.join(', ')}]`
        );
      }

      const operations = dto.records.map(async (record) => {
        try {
          // Style A: Try camelCase index matching standard configurations
          return await tx[gradeModelName].upsert({
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
          // Style B: Fallback if your layout matches strict snake_case indexing rules
          if (err.message?.includes('Unknown argument') || err.code === 'P2025') {
            return await tx[gradeModelName].upsert({
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

      const processedResults = await Promise.all(operations);
      return {
        message: 'Bulk grades ingestion completed successfully.',
        recordsProcessed: processedResults.length,
      };
    });
  }

  /**
   * 🔍 Fetches all historical grade rows linked to a student
   */
  async getStudentGradeSheet(campusId: string, studentId: string) {
    const gradeModelName = ['gradeRecord', 'grade_record', 'GradeRecord', 'gradeRecords', 'grade_records', 'grade', 'grades']
      .find(model => typeof this.prisma[model] !== 'undefined');

    if (!gradeModelName) {
      throw new NotFoundException('Grade record database layout mapping configuration is missing.');
    }

    let historicalGrades = [];
    try {
      historicalGrades = await this.prisma[gradeModelName].findMany({
        where: { studentId: studentId, campusId: campusId },
        include: { assessment: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      try {
        historicalGrades = await this.prisma[gradeModelName].findMany({
          where: { student_id: studentId, campus_id: campusId },
          include: { assessment: true },
          orderBy: { created_at: 'desc' },
        });
      } catch (err) {
        historicalGrades = [];
      }
    }

    return {
      studentId,
      records: historicalGrades.map((grade: any) => ({
        gradeId: grade.id,
        assessmentId: grade.assessmentId || grade.assessment_id,
        assessmentTitle: grade.assessment?.title || 'Unknown Assessment',
        assessmentType: grade.assessment?.type || 'EXAM',
        scoreObtained: grade.score,
        maxPossiblePoints: grade.assessment?.maxPoints || grade.assessment?.max_points || 100,
        weightageContribution: grade.assessment?.weightPercentage || grade.assessment?.weight_percentage || 0,
        remarks: grade.remarks,
        recordedAt: grade.createdAt || grade.created_at,
      })),
    };
  }

  /**
   * 📊 Compiles a complete Terminal Report Card with automated grade translations
   */
  async generateTerminalReportCard(campusId: string, studentId: string, termId: string, curriculumType: 'CBC' | 'KCSE') {
    // 1. Fetch raw profile to ensure student context is active
    const student = await this.prisma['student'].findUnique({
      where: { id: studentId },
      include: { stream: { include: { class: true } } },
    });

    if (!student) {
      throw new NotFoundException(`Student profile with ID "${studentId}" does not exist.`);
    }

    // 2. Extract historical records linked to this student
    const sheetData = await this.getStudentGradeSheet(campusId, studentId);
    
    // 3. Group and aggregate multi-assessment elements by Subject title
    const subjectMap: Record<string, { totalScore: number; maxPoints: number; recordsCount: number }> = {};
    
    sheetData.records.forEach((rec) => {
      const subjectKey = rec.assessmentTitle.split('-')[0].trim() || 'General Studies';
      if (!subjectMap[subjectKey]) {
        subjectMap[subjectKey] = { totalScore: 0, maxPoints: 0, recordsCount: 0 };
      }
      subjectMap[subjectKey].totalScore += rec.scoreObtained;
      subjectMap[subjectKey].maxPoints += rec.maxPossiblePoints;
      subjectMap[subjectKey].recordsCount += 1;
    });

    // 4. Loop through grouped components and resolve performance marks using GradingScaleService
    const subjectPerformanceLines = [];
    let cumulativePercentageSum = 0;

    for (const [subjectName, summary] of Object.entries(subjectMap)) {
      const computedPercentage = summary.maxPoints > 0 
        ? Number(((summary.totalScore / summary.maxPoints) * 100).toFixed(2))
        : 0;
      
      cumulativePercentageSum += computedPercentage;

      const scaleEvaluation = await this.gradingScaleService.interpretScore(
        campusId,
        curriculumType,
        computedPercentage
      );

      subjectPerformanceLines.push({
        subjectName,
        aggregateScore: summary.totalScore,
        maxPossiblePoints: summary.maxPoints,
        calculatedPercentage: computedPercentage,
        finalGrade: scaleEvaluation.grade,
        gradePoints: scaleEvaluation.gradePoints,
        remarks: scaleEvaluation.qualitativeRubric,
      });
    }

    const totalSubjects = subjectPerformanceLines.length;
    const terminalMeanPercentage = totalSubjects > 0 
      ? Number((cumulativePercentageSum / totalSubjects).toFixed(2)) 
      : 0;

    const terminalScaleTranslation = await this.gradingScaleService.interpretScore(
      campusId,
      curriculumType,
      terminalMeanPercentage
    );

    return {
      meta: {
        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Enrolled Student',
        admissionNumber: student.admission_no || student.id.slice(0, 8).toUpperCase(),
        classTitle: student.stream?.class?.name || 'Unassigned Grade',
        streamTitle: student.stream?.name || 'Unassigned Stream',
        evaluationTermId: termId,
      },
      academics: {
        subjectPerformanceLines,
        summaryMetrics: {
          totalSubjectsEvaluated: totalSubjects,
          meanPercentageScore: terminalMeanPercentage,
          overallMeanGrade: terminalScaleTranslation.grade,
          aggregateGradePoints: subjectPerformanceLines.reduce((acc, curr) => acc + curr.gradePoints, 0),
          principalVerdict: terminalScaleTranslation.qualitativeRubric,
        }
      }
    };
  }
}