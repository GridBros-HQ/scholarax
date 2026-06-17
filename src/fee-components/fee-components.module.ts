import { Module } from '@nestjs/common';
import { FeeComponentsService } from './fee-components.service';
import { FeeComponentsController } from './fee-components.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeeComponentsController],
  providers: [FeeComponentsService],
})
export class FeeComponentsModule {}