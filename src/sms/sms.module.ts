import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService], // 👈 CRUCIAL: Exports this so the billing callback hook can use it!
})
export class SmsModule {}