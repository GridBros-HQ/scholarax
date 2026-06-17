import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradingInterpretationResult } from './interfaces/grading-result.interface';

@Injectable()
export class GradingScaleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates a percentage mark against campus constraints
   * @param campusId Strict multi-tenant context boundary header passed from controller
   * @param curriculumType System pipeline tracker ("CBC" | "KCSE")
   * @param percentage Normalized calculation score out of 100
   */
  async interpretScore(
    campusId: string,
    curriculumType: 'CBC' | 'KCSE',
    percentage: number,
  ): Promise<GradingInterpretationResult> {
    const db = this.prisma as any;

    try {
      // 1. Dynamic Tenant Override Scan
      const customScaleMatches = await db.gradingScale.findMany({
        where: {
          campus_id: campusId,
          curriculum_type: curriculumType,
        },
      });

      if (customScaleMatches && customScaleMatches.length > 0) {
        const matchedOverride = customScaleMatches.find(
          (scale: any) => percentage >= scale.min_percentage && percentage <= scale.max_percentage,
        );

        if (matchedOverride) {
          return {
            grade: matchedOverride.grade,
            gradePoints: matchedOverride.grade_points,
            qualitativeRubric: matchedOverride.qualitative_rubric || '',
            isCustomOverride: true,
          };
        }
      }
    } catch (err) {
      // Log warning and fall through to standard defaults cleanly
      console.warn(`[GRADING_ENGINE] Database scale lookup skipped for campus: ${campusId}. Applying default ranges.`);
    }

    // 2. National Educational System Fallbacks
    if (curriculumType === 'CBC') {
      return this.evaluateDefaultCbcTrack(percentage);
    } else if (curriculumType === 'KCSE') {
      return this.evaluateDefaultKcseTrack(percentage);
    }

    throw new InternalServerErrorException(`Unsupported curriculum option: "${curriculumType}"`);
  }

  private evaluateDefaultCbcTrack(score: number): GradingInterpretationResult {
    if (score >= 80.0) {
      return { grade: 'EE', gradePoints: 4, qualitativeRubric: 'Exceeding Expectations', isCustomOverride: false };
    }
    if (score >= 60.0) {
      return { grade: 'ME', gradePoints: 3, qualitativeRubric: 'Meeting Expectations', isCustomOverride: false };
    }
    if (score >= 40.0) {
      return { grade: 'AE', gradePoints: 2, qualitativeRubric: 'Approaching Expectations', isCustomOverride: false };
    }
    return { grade: 'BE', gradePoints: 1, qualitativeRubric: 'Below Expectations', isCustomOverride: false };
  }

  private evaluateDefaultKcseTrack(score: number): GradingInterpretationResult {
    if (score >= 80.0) return { grade: 'A', gradePoints: 12, qualitativeRubric: 'Excellent', isCustomOverride: false };
    if (score >= 75.0) return { grade: 'A-', gradePoints: 11, qualitativeRubric: 'Very Good', isCustomOverride: false };
    if (score >= 70.0) return { grade: 'B+', gradePoints: 10, qualitativeRubric: 'Very Good', isCustomOverride: false };
    if (score >= 65.0) return { grade: 'B', gradePoints: 9, qualitativeRubric: 'Good', isCustomOverride: false };
    if (score >= 60.0) return { grade: 'B-', gradePoints: 8, qualitativeRubric: 'Good', isCustomOverride: false };
    if (score >= 55.0) return { grade: 'C+', gradePoints: 7, qualitativeRubric: 'Average', isCustomOverride: false };
    if (score >= 50.0) return { grade: 'C', gradePoints: 6, qualitativeRubric: 'Average', isCustomOverride: false };
    if (score >= 45.0) return { grade: 'C-', gradePoints: 5, qualitativeRubric: 'Below Average', isCustomOverride: false };
    if (score >= 40.0) return { grade: 'D+', gradePoints: 4, qualitativeRubric: 'Below Average', isCustomOverride: false };
    if (score >= 35.0) return { grade: 'D', gradePoints: 3, qualitativeRubric: 'Poor', isCustomOverride: false };
    if (score >= 30.0) return { grade: 'D-', gradePoints: 2, qualitativeRubric: 'Poor', isCustomOverride: false };
    return { grade: 'E', gradePoints: 1, qualitativeRubric: 'Very Poor', isCustomOverride: false };
  }
}