import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { StreamsService } from './streams.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('streams')
@UseGuards(TenantAuthGuard)
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateStreamDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.streamsService.create(dto, campusId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentCampus() campusId: string) {
    return this.streamsService.findAll(campusId);
  }
}