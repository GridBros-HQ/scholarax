import { Module } from '@nestjs/common';
import { FeeStructuresService } from './fee-structures.service';
import { FeeStructuresController } from './fee-structures.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeStructuresController],
  providers: [FeeStructuresService],
})
export class FeeStructuresModule {}