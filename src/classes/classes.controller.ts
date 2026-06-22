import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('classes')
@UseGuards(TenantAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateClassDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.classesService.create(dto, campusId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentCampus() campusId: string) {
    return this.classesService.findAll(campusId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentCampus() campusId: string,
  ) {
    return this.classesService.findOne(id, campusId);
  }
}