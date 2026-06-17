import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService & PrismaClient) {}

  // 🔑 Enforced dynamic campusId requirement by removing the optional marker
  async enrollStudent(dto: CreateStudentDto, campusId: string) {
    
    // 🛡️ Cross-Tenant Boundary Check: Verify targeted stream belongs to the current user's campus
    const targetStream = await this.prisma.stream.findFirst({
      where: { id: dto.streamId, campus_id: campusId }
    });

    if (!targetStream) {
      throw new NotFoundException(`Target enrollment stream with ID "${dto.streamId}" does not exist on this campus.`);
    }

    try {
      const student = await this.prisma.student.create({
        data: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          admission_number: dto.admissionNumber,
          date_of_birth: new Date('2010-01-01'),
          gender: 'UNKNOWN',
          enrollment_date: new Date(),
          status: 'ACTIVE',
          campus: {
            connect: { id: campusId }, // 🔄 FIXED: Trap eliminated. Securely maps user tenant structure.
          },
          stream: {
            connect: { id: dto.streamId },
          },
          guardians: {
            create: [
              {
                relationship_type: 'GUARDIAN',
                guardian: {
                  connect: { id: dto.guardianId },
                },
              },
            ],
          },
        },
        include: {
          stream: true,
          guardians: true,
        },
      });

      return student;
    } catch (error) {
      throw new BadRequestException(
        `Failed to enroll student. Please verify that the admission number is unique and the provided guardian ID exists. Error: ${(error as any).message}`
      );
    }
  }
}