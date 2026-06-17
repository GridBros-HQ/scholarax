import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('classes')
@UseGuards(TenantAuthGuard) // 🛡️ Restricts classroom boundaries to verified tenants
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  create(
    @Body() dto: CreateClassDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.classesService.create(dto, campusId);
  }

  @Get()
  findAll(@CurrentCampus() campusId: string) {
    return this.classesService.findAll(campusId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string, // Added ParseUUIDPipe for absolute data-type safety
    @CurrentCampus() campusId: string,
  ) {
    return this.classesService.findOne(id, campusId);
  }
}