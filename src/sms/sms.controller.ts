import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SmsService } from './sms.service';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';

@Controller('sms')
@UseGuards(TenantAuthGuard) // 🛡️ Restricts broad communication routes to verified campus sessions
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('dispatch')
  @HttpCode(HttpStatus.OK)
  async dispatchManualNotification(
    @CurrentCampus() campusId: string,
    @Body() body: { to: string; text: string },
  ) {
    return this.smsService.sendSms(campusId, body.to, body.text);
  }
}