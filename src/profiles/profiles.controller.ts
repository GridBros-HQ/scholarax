import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { CreateGuardianProfileDto } from './dto/create-guardian-profile.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';
import { RbacGuard } from '../roles/guards/rbac.guard';
import { Roles } from '../roles/decorators/roles.decorator';

@Controller('profiles')
@UseGuards(TenantAuthGuard, RbacGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('staff')
  @Roles('ADMIN', 'SUPERVISOR')
  async createStaff(
    @Body() createStaffProfileDto: CreateStaffProfileDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.profilesService.createStaff(createStaffProfileDto, campusId);
  }

  @Post('guardians')
  @Roles('ADMIN', 'SUPERVISOR')
  async createGuardian(@Body() createGuardianProfileDto: CreateGuardianProfileDto) {
    return this.profilesService.createGuardian(createGuardianProfileDto);
  }

  @Get('staff')
  @Roles('ADMIN', 'SUPERVISOR')
  async getStaff(@CurrentCampus() campusId: string) {
    return this.profilesService.getStaffByTenant(campusId);
  }

  @Get('guardians')
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  async findAllGuardiansByTenant(@CurrentCampus() campusId: string) {
    return this.profilesService.findAllGuardiansByTenant(campusId);
  }

  @Post('students')
  @Roles('ADMIN', 'SUPERVISOR')
  async createStudent(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.profilesService.createStudent(createStudentDto, campusId);
  }

  @Get('students')
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  async findAllStudentsByTenant(@CurrentCampus() campusId: string) {
    return this.profilesService.findAllStudentsByTenant(campusId);
  }
}