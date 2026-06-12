import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { CreateGuardianProfileDto } from './dto/create-guardian-profile.dto';
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
    // Casting to any to allow contactString and phoneExtension which are mandated 
    // by the user but might not be in the current Prisma schema yet.
    return this.prisma.staff.create({
      data: {
        user_id: dto.userId,
        contactString: dto.contactString,
        phoneExtension: dto.phoneExtension,
        employee_code: dto.employeeCode || `EMP-${Date.now()}`,
        designation: dto.designation || 'Staff',
        joining_date: new Date(),
      } as any,
    });
  }

  async createGuardian(dto: CreateGuardianProfileDto) {
    const campusId = this.getCampusId();

    if (dto.userId) {
      // Ensure the core user exists and belongs to this campus
      const user = await this.prisma.user.findFirst({
        where: { id: dto.userId, campusId },
      });
      if (!user) {
        throw new NotFoundException('User not found in this campus');
      }
    }

    // Creating Guardian profile tied back to the User.
    return this.prisma.guardian.create({
      data: {
        user_id: dto.userId,
        contactString: dto.contactString,
        phoneExtension: dto.phoneExtension,
        first_name: dto.firstName || 'Unknown',
        last_name: dto.lastName || 'Unknown',
        national_id: dto.nationalId || `ID-${Date.now()}`,
      } as any,
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

  async getGuardianByTenant() {
    const campusId = this.getCampusId();
    
    // Isolate records using campusId through the core 'User' relationship scope.
    return this.prisma.guardian.findMany({
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
}
