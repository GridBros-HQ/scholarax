import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService & PrismaClient) {}

  async enrollStudent(dto: CreateStudentDto, campusId?: string) {
    const activeCampusId = campusId || '10000000-0000-0000-0000-000000000001';

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
            connect: { id: activeCampusId },
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
        `Failed to enroll student. Please verify that the admission number is unique and the provided stream and guardian IDs exist. Error: ${(error as any).message}`
      );
    }
  }
}
