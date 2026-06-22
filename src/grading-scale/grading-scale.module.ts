import { Module } from '@nestjs/common';
import { GradingScaleService } from './grading-scale.service';
import { GradingScaleController } from './grading-scale.controller';


@Module({
  controllers: [GradingScaleController],
  providers: [GradingScaleService],
  exports: [GradingScaleService], // Exported for external analytics/reports modules
})
export class GradingScaleModule {}