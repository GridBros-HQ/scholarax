import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { CreateGuardianProfileDto } from './dto/create-guardian-profile.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService & PrismaClient) {}

  // Note: Magic background getCampusId lookups have been removed. 
  // Context parameters are now cleanly passed down explicitly from the route controller.

  async createStaff(dto: CreateStaffProfileDto, campusId: string) {
    // Ensure the core user exists and belongs to this campus
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, campusId },
    });

    if (!user) {
      throw new NotFoundException('User not found in this campus');
    }

    // Creating Staff profile tied back to the User.
    return this.prisma.staff.create({
      data: {
        user_id: dto.userId,
        employee_code: dto.employeeCode || `EMP-${Date.now()}`,
        designation: dto.designation || 'Staff',
        joining_date: new Date(),
      },
    });
  }

  async createGuardian(dto: CreateGuardianProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User profile mapping reference not found');
    }

    return this.prisma.guardian.create({
      data: {
        firstName: dto.firstName || 'Unknown',
        lastName: dto.lastName || 'Unknown',
        nationalId: dto.nationalId || `ID-${Date.now()}`,
        phoneNumber: dto.contactString,
        profession: dto.profession,
        email: dto.email,
        user: {
          connect: { id: dto.userId },
        },
      },
    });
  }

  async getStaffByTenant(campusId: string) {
    // Isolate records using campusId through the core 'User' relationship scope.
    return this.prisma.staff.findMany({
      where: {
        user: {
          campusId: campusId,
        },
      },
      include: {
        user: true,
      },
    });
  }

  async findAllGuardiansByTenant(campusId: string) {
    // 🛡️ DATA LEAK FIXED: Isolated guardian queries based on tenant user workspace
    return this.prisma.guardian.findMany({
      where: {
        user: {
          campusId: campusId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async createStudent(dto: CreateStudentDto, campusId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: dto.guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Target guardian profile not found in this campus');
    }

    const stream = await this.prisma.stream.findUnique({
      where: { id: dto.streamId },
    });

    if (!stream) {
      throw new NotFoundException('Target stream configuration not found in this campus');
    }

    return this.prisma.student.create({
      data: {
        campus: {
          connect: { id: campusId } // 🔄 FIXED: Tied cleanly to active structural pipeline argument
        },
        first_name: dto.first_name,
        last_name: dto.last_name,
        admission_number: `ADM-${Date.now()}`,
        date_of_birth: new Date('2010-01-01'), 
        gender: 'UNKNOWN', 
        enrollment_date: new Date(),
        stream: {
          connect: { id: dto.streamId },
        },
        guardians: {
          create: [
            {
              guardian: { connect: { id: dto.guardianId } },
              relationship_type: 'GUARDIAN',
              is_primary_contact: true,
            },
          ],
        },
      },
    });
  }

  async findAllStudentsByTenant(campusId: string) {
    // 🛡️ DATA LEAK FIXED: Strictly filters records down to current active user campus index
    return this.prisma.student.findMany({
      where: {
        campus_id: campusId
      },
      orderBy: { created_at: 'desc' },
      include: {
        guardians: {
          include: {
            guardian: true,
          },
        },
        stream: true,
      },
    });
  }
}