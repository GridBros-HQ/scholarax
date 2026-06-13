import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StreamsService } from './streams.service';
import { CreateStreamDto } from './dto/create-stream.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('streams')
@UseGuards(JwtAuthGuard)
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Post()
  create(@Body() dto: CreateStreamDto) {
    return this.streamsService.create(dto);
  }

  @Get()
  findAll() {
    return this.streamsService.findAll();
  }
}