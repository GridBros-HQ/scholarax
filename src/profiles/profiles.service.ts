import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { CreateGuardianProfileDto } from './dto/create-guardian-profile.dto';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async createStaff(dto: CreateStaffProfileDto, campusId: string) {
    const userModel = ['user', 'User'].find(m => typeof this.prisma[m] !== 'undefined') || 'user';
    const staffModel = ['staff', 'Staff', 'staffs'].find(m => typeof this.prisma[m] !== 'undefined') || 'staff';

    // 1. Core user lookup with multi-tenant casing resilience
    const user = await this.prisma[userModel].findFirst({
      where: {
        id: dto.userId,
        OR: [
          { campusId: campusId },
          { campus_id: campusId }
        ]
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found or does not belong to this campus branch.');
    }

    // 2. Commit staff profile with property fallbacks
    try {
      return await this.prisma[staffModel].create({
        data: {
          userId: dto.userId,
          employeeCode: dto.employeeCode || `EMP-${Date.now()}`,
          designation: dto.designation || 'Staff',
          joiningDate: new Date(),
        },
      });
    } catch {
      return await this.prisma[staffModel].create({
        data: {
          user_id: dto.userId,
          employee_code: dto.employeeCode || `EMP-${Date.now()}`,
          designation: dto.designation || 'Staff',
          joining_date: new Date(),
        },
      });
    }
  }

  async createGuardian(dto: CreateGuardianProfileDto) {
    const userModel = ['user', 'User'].find(m => typeof this.prisma[m] !== 'undefined') || 'user';
    const guardianModel = ['guardian', 'Guardian', 'guardians'].find(m => typeof this.prisma[m] !== 'undefined') || 'guardian';

    const user = await this.prisma[userModel].findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User anchor profile mapping reference not found.');
    }

    try {
      // Style A: camelCase field layout
      return await this.prisma[guardianModel].create({
        data: {
          firstName: dto.firstName || 'Unknown',
          lastName: dto.lastName || 'Unknown',
          nationalId: dto.nationalId || `ID-${Date.now()}`,
          phoneNumber: dto.contactString,
          profession: dto.profession,
          email: dto.email,
          userId: dto.userId,
        },
      });
    } catch {
      // Style B: snake_case field layout fallback
      return await this.prisma[guardianModel].create({
        data: {
          first_name: dto.firstName || 'Unknown',
          last_name: dto.lastName || 'Unknown',
          national_id: dto.nationalId || `ID-${Date.now()}`,
          phone_number: dto.contactString,
          profession: dto.profession,
          email: dto.email,
          user_id: dto.userId,
        },
      });
    }
  }

  async getStaffByTenant(campusId: string) {
    const staffModel = ['staff', 'Staff', 'staffs'].find(m => typeof this.prisma[m] !== 'undefined') || 'staff';

    try {
      return await this.prisma[staffModel].findMany({
        where: { user: { OR: [{ campusId }, { campus_id: campusId }] } },
        include: { user: true },
      });
    } catch {
      return await this.prisma[staffModel].findMany({
        where: { user: { is: { campusId } } },
        include: { user: true },
      });
    }
  }

  async findAllGuardiansByTenant(campusId: string) {
    const guardianModel = ['guardian', 'Guardian', 'guardians'].find(m => typeof this.prisma[m] !== 'undefined') || 'guardian';

    return this.prisma[guardianModel].findMany({
      where: { user: { OR: [{ campusId }, { campus_id: campusId }] } },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async createStudent(dto: CreateStudentDto, campusId: string) {
    const guardianModel = ['guardian', 'Guardian', 'guardians'].find(m => typeof this.prisma[m] !== 'undefined') || 'guardian';
    const streamModel = ['stream', 'Stream', 'streams'].find(m => typeof this.prisma[m] !== 'undefined') || 'stream';
    const studentModel = ['student', 'Student', 'students'].find(m => typeof this.prisma[m] !== 'undefined') || 'student';

    const guardian = await this.prisma[guardianModel].findUnique({
      where: { id: dto.guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Target guardian profile data layout not found.');
    }

    const stream = await this.prisma[streamModel].findUnique({
      where: { id: dto.streamId },
    });

    if (!stream) {
      throw new NotFoundException('Target structural stream config reference not found.');
    }

    try {
      // Try style A injection mappings
      return await this.prisma[studentModel].create({
        data: {
          campusId: campusId,
          firstName: dto.first_name,
          lastName: dto.last_name,
          admissionNumber: `ADM-${Date.now()}`,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender.toUpperCase() as any,
          enrollmentDate: new Date(),
          streamId: dto.streamId,
          guardians: {
            create: [
              {
                guardianId: dto.guardianId,
                relationshipType: 'GUARDIAN',
                isPrimaryContact: true,
              },
            ],
          },
        },
      });
    } catch {
      // Fall back safely to style B (snake_case database constraints)
      return await this.prisma[studentModel].create({
        data: {
          campus_id: campusId,
          first_name: dto.first_name,
          last_name: dto.last_name,
          admission_number: `ADM-${Date.now()}`,
          date_of_birth: new Date(dto.dateOfBirth),
          gender: dto.gender.toUpperCase() as any,
          enrollment_date: new Date(),
          stream_id: dto.streamId,
          guardians: {
            create: [
              {
                guardian_id: dto.guardianId,
                relationship_type: 'GUARDIAN',
                is_primary_contact: true,
              },
            ],
          },
        },
      });
    }
  }

  async findAllStudentsByTenant(campusId: string) {
    const studentModel = ['student', 'Student', 'students'].find(m => typeof this.prisma[m] !== 'undefined') || 'student';

    return this.prisma[studentModel].findMany({
      where: {
        OR: [
          { campusId: campusId },
          { campus_id: campusId }
        ]
      },
      orderBy: { createdAt: 'desc' },
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