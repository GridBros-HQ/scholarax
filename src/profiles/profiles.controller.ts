import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { CreateGuardianProfileDto } from './dto/create-guardian-profile.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

// Importing the RbacGuard and Roles from the roles module as specified.
// @ts-ignore
import { RbacGuard } from '../roles/guards/rbac.guard';
// @ts-ignore
import { Roles } from '../roles/decorators/roles.decorator';

@Controller('profiles')
@UseGuards(TenantAuthGuard, RbacGuard) // 🛡️ Sequential Guarding: TenantAuthGuard decrypts token context before Rbac checks positions
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('staff')
  @Roles('ADMIN', 'SUPERVISOR')
  createStaff(
    @Body() createStaffProfileDto: CreateStaffProfileDto,
    @CurrentCampus() campusId: string, // 🔑 Safely injected from verified token context
  ) {
    return this.profilesService.createStaff(createStaffProfileDto, campusId);
  }

  @Post('guardians')
  @Roles('ADMIN', 'SUPERVISOR')
  createGuardian(@Body() createGuardianProfileDto: CreateGuardianProfileDto) {
    // Left intact as service implementation does not require direct campus mapping constraints
    return this.profilesService.createGuardian(createGuardianProfileDto);
  }

  @Get('staff')
  @Roles('ADMIN', 'SUPERVISOR')
  getStaff(@CurrentCampus() campusId: string) {
    return this.profilesService.getStaffByTenant(campusId);
  }

  @Get('guardians')
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  findAllGuardiansByTenant(@CurrentCampus() campusId: string) {
    return this.profilesService.findAllGuardiansByTenant(campusId);
  }

  @Post('students')
  @Roles('ADMIN', 'SUPERVISOR')
  createStudent(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.profilesService.createStudent(createStudentDto, campusId);
  }

  @Get('students')
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  findAllStudentsByTenant(@CurrentCampus() campusId: string) {
    return this.profilesService.findAllStudentsByTenant(campusId);
  }
}