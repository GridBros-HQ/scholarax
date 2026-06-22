import { Controller, Post, Get, Param, Body, UseGuards, Req, HttpCode, HttpStatus, Ip, ForbiddenException } from '@nestjs/common';
import { MpesaService } from './mpesa.service';
import { StkPushInitiateDto, SafaricomCallbackPayload } from './mpesa.interfaces';
import { TenantAuthGuard } from 'src/auth/guards/tenant-auth.guard';
import { CurrentCampus } from 'src/auth/decorators/current-campus.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 🛡️ Data Transfer Object validating inbound credential entry streams
 */
export class SaveGatewayConfigDto {
  @IsString()
  @IsNotEmpty()
  shortCode: string;

  @IsString()
  @IsNotEmpty()
  consumerKey: string;

  @IsString()
  @IsNotEmpty()
  consumerSecret: string;

  @IsString()
  @IsNotEmpty()
  passkey: string;
}

@Controller('payments/mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  /**
   * 🛠️ Administrative Endpoint: Securely saves or updates dynamic campus credentials
   */
  @Post('config')
  @UseGuards(TenantAuthGuard)
  @HttpCode(HttpStatus.OK)
  async saveConfig(
    @Body() dto: SaveGatewayConfigDto,
    @CurrentCampus() campusId: string,
  ) {
    return this.mpesaService.upsertGatewayConfig(dto, campusId);
  }

  @Post('stk-push')
  @UseGuards(TenantAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initiateStk(
    @Body() dto: StkPushInitiateDto,
    @CurrentCampus() campusId: string,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    const userId = req.user?.userId;
    return this.mpesaService.initiateStkPush(dto, campusId, userId, ipAddress);
  }

  /**
   * 📡 GET Bridge: Allows UI frontends to short-poll the status of a payment 
   */
  @Get('status/:checkoutRequestId')
  @UseGuards(TenantAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getTransactionStatus(@Param('checkoutRequestId') checkoutRequestId: string) {
    return this.mpesaService.getTransactionStatus(checkoutRequestId);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Body() payload: SafaricomCallbackPayload,
    @Ip() ipAddress: string,
  ) {
    // 🛡️ SECURITY LAYER: Production IP whitelist filtering gate
    const allowedIps = ['196.201.214.', '196.201.213.', '196.201.212.', '127.0.0.1', '::1'];
    const isWhitelisted = allowedIps.some(range => ipAddress.startsWith(range));
    
    if (!isWhitelisted) {
      throw new ForbiddenException('Security Breach Alert: Outbound origin address rejected.');
    }

    return this.mpesaService.handleWebhookCallback(payload, ipAddress);
  }
}