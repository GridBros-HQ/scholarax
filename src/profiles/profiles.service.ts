import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { CreateGuardianProfileDto } from './dto/create-guardian-profile.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { tenantContext } from '../prisma/tenant-context';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService & PrismaClient) {}

  private getCampusId(): string {
    const context = tenantContext.getStore();
    if (!context || !context.campusId) {
      throw new Error('Campus context is missing or x-campus-id header was not provided.');
    }
    return context.campusId;
  }

  async createStaff(dto: CreateStaffProfileDto) {
    const campusId = this.getCampusId();
    
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
      throw new NotFoundException('User not found in this campus');
    }

    return this.prisma.guardian.create({
      data: {
        first_name: dto.firstName || 'Unknown',
        last_name: dto.lastName || 'Unknown',
        national_id: dto.nationalId || `ID-${Date.now()}`,
        phone_number: dto.contactString,
        profession: dto.profession,
        email: dto.email,
        user: {
          connect: { id: dto.userId },
        },
      },
    });
  }

  async getStaffByTenant() {
    const campusId = this.getCampusId();
    
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

  async findAllGuardiansByTenant() {
    return this.prisma.guardian.findMany({
      orderBy: { created_at: 'desc' },
      include: { user: true },
    });
  }

  async createStudent(dto: CreateStudentDto) {
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
          connect: { id: this.getCampusId() }
        },
        first_name: dto.first_name,
        last_name: dto.last_name,
        admission_number: `ADM-${Date.now()}`,
        date_of_birth: new Date('2010-01-01'), // Default since not provided in dto
        gender: 'UNKNOWN', // Default since not provided in dto
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

  async findAllStudentsByTenant() {
    return this.prisma.student.findMany({
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
