import { Controller, Get, Post, Body } from '@nestjs/common';
import { CampusService } from './campus.service';
import { CreateCampusDto } from './create-campus.dto';

@Controller('campuses')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Post()
  create(@Body() createCampusDto: CreateCampusDto) {
    return this.campusService.create(createCampusDto);
  }

  @Get()
  findAll() {
    return this.campusService.findAll();
  }
}