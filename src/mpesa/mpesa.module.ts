import { Module } from '@nestjs/common';
import { MpesaService } from './mpesa.service';
import { MpesaController } from './mpesa.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsModule } from 'src/sms/sms.module'; // 🔄 Added tracking path registration

@Module({
  imports: [
    PrismaModule, 
    SmsModule // 🛡️ Unlocks cross-module invocation access for the automated text receipt workflow
  ],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}