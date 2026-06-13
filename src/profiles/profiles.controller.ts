import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { CreateGuardianProfileDto } from './dto/create-guardian-profile.dto';

// Importing the RbacGuard and Roles from the roles module as specified.
// Assuming standard relative paths based on NestJS structure.
// @ts-ignore
import { RbacGuard } from '../roles/guards/rbac.guard';
// @ts-ignore
import { Roles } from '../roles/decorators/roles.decorator';

@Controller('profiles')
@UseGuards(RbacGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('staff')
  @Roles('ADMIN', 'SUPERVISOR')
  createStaff(@Body() createStaffProfileDto: CreateStaffProfileDto) {
    return this.profilesService.createStaff(createStaffProfileDto);
  }

  @Post('guardians')
  @Roles('ADMIN', 'SUPERVISOR')
  createGuardian(@Body() createGuardianProfileDto: CreateGuardianProfileDto) {
    return this.profilesService.createGuardian(createGuardianProfileDto);
  }

  @Get('staff')
  @Roles('ADMIN', 'SUPERVISOR')
  getStaff() {
    return this.profilesService.getStaffByTenant();
  }

  @Get('guardians')
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  findAllGuardiansByTenant() {
    return this.profilesService.findAllGuardiansByTenant();
  }
}
