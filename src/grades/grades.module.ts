import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { GradingScaleModule } from '../grading-scale/grading-scale.module'; // 🔄 Added cross-module tracking dependency

@Module({
  imports: [
    PrismaModule,
    GradingScaleModule, // 🛡️ Registered to unlock the score interpretation engine inside GradesService
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}