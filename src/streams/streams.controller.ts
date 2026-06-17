import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StreamsService } from './streams.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('streams')
@UseGuards(TenantAuthGuard) // 🛡️ Restricts stream tracking parameters to validated school users
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  create(
    @Body() dto: CreateStreamDto,
    @CurrentCampus() campusId: string, // 🔑 Securely injected from cryptographic token
  ) {
    return this.streamsService.create(dto, campusId);
  }

  @Get()
  findAll(@CurrentCampus() campusId: string) {
    return this.streamsService.findAll(campusId);
  }
}