import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client'; 
import { SmsService } from 'src/sms/sms.service'; // 🔄 Imported for real-time text receipt execution
import * as crypto from 'crypto';

export interface StkPushInitiateDto {
  amount: number;
  phoneNumber: string;
  studentId: string;
  invoiceId: string;
}

export interface SaveGatewayConfigDto {
  shortCode: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly CRYPTO_KEY = Buffer.from('test_secret_key_must_be_thirty_two_bytes_long'.slice(0, 32));
  private readonly ALGORITHM = 'aes-256-gcm';

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService // 🛡️ Injected the SMS automation handler
  ) {}

  private encrypt(plainText: string): string {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.CRYPTO_KEY, iv);
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');
      return `${iv.toString('hex')}:${encrypted}:${tag}`;
    } catch (error) {
      throw new InternalServerErrorException('Cryptographic operational failure while encrypting payment credentials.');
    }
  }

  private decrypt(cipherText: string): string {
    try {
      const [ivHex, encryptedHex, tagHex] = cipherText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.CRYPTO_KEY, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException('Cryptographic operational failure while decrypting payment gateways.');
    }
  }

  async upsertGatewayConfig(dto: SaveGatewayConfigDto, campusId: string) {
    const encryptedKey = this.encrypt(dto.consumerKey);
    const encryptedSecret = this.encrypt(dto.consumerSecret);
    const encryptedPasskey = this.encrypt(dto.passkey);

    return await this.prisma['paymentGatewayConfig'].upsert({
      where: { campusId },
      update: {
        shortCode: dto.shortCode,
        consumerKey: encryptedKey,
        consumerSecret: encryptedSecret,
        passkey: encryptedPasskey,
      },
      create: {
        campusId,
        shortCode: dto.shortCode,
        consumerKey: encryptedKey,
        consumerSecret: encryptedSecret,
        passkey: encryptedPasskey,
      },
    });
  }

  async initiateStkPush(dto: StkPushInitiateDto, campusId: string, userId: string, ipAddress: string): Promise<any> {
    const config = await this.prisma['paymentGatewayConfig'].findUnique({
      where: { campusId },
    });

    if (!config) {
      throw new NotFoundException('M-Pesa payment integration is not configured for this campus context.');
    }

    const rawShortcode = config.shortCode;
    const rawKey = this.decrypt(config.consumerKey);
    const rawSecret = this.decrypt(config.consumerSecret);
    const rawPasskey = this.decrypt(config.passkey);

    const authHeader = Buffer.from(`${rawKey}:${rawSecret}`).toString('base64');
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: { Authorization: `Basic ${authHeader}` },
    });
    
    if (!tokenResponse.ok) {
      throw new InternalServerErrorException('Safaricom Daraja API authentication handshake failed.');
    }
    
    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${rawShortcode}${rawPasskey}${timestamp}`).toString('base64');

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: rawShortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(dto.amount),
        PartyA: dto.phoneNumber, 
        PartyB: rawShortcode,
        PhoneNumber: dto.phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL, 
        AccountReference: `INV-${dto.invoiceId.slice(0, 8).toUpperCase()}`,
        TransactionDesc: 'Scholarax Tuition Fee Collection Engine Run',
      }),
    });

    if (!stkResponse.ok) {
      const errorDump = await stkResponse.text();
      this.logger.error(`Safaricom Core Gateway Rejection Trace: ${errorDump}`);
      throw new BadRequestException('Safaricom transaction gateway rejected parsing execution parameters.');
    }

    const stkData = await stkResponse.json() as any;

    return await this.prisma['$transaction'](async (tx: any) => {
      const txRecord = await tx['mpesaTransaction'].create({
        data: {
          campusId,
          studentId: dto.studentId,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          phoneNumber: dto.phoneNumber,
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID,
          status: PaymentStatus.PENDING,
        },
      });

      await tx['paymentAuditTrail'].create({
        data: {
          campusId,
          userId,
          action: 'MPESA_STK_PUSH_INITIATED',
          ipAddress,
          details: { 
            studentId: dto.studentId, 
            invoiceId: dto.invoiceId, 
            amount: dto.amount, 
            checkoutRequestId: stkData.CheckoutRequestID 
          },
        },
      });

      return {
        message: 'Lipa Na M-Pesa STK menu initialized successfully on client device.',
        checkoutRequestId: txRecord.checkoutRequestId,
        status: txRecord.status,
      };
    });
  }

  async handleWebhookCallback(payload: any, ipAddress: string): Promise<void> {
    this.logger.log(`📥 Webhook intercepted! Raw Safaricom Payload: ${JSON.stringify(payload)}`);

    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback) {
      throw new BadRequestException('Malformed or unrecognizable transaction callback payload footprint intercepted.');
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    const existingTx = await this.prisma['mpesaTransaction'].findUnique({
      where: { checkoutRequestId },
    });

    if (!existingTx) {
      this.logger.error(`CRITICAL WARNING: Unidentified checkout request callback key intercepted: ${checkoutRequestId}`);
      throw new NotFoundException('Transaction execution tracking context target reference mismatch.');
    }

    // 🔄 Variables allocated to forward transactional configurations safely outside the database thread scope
    let sendSmsConfirmation = false;
    let smsPayload = { campusId: '', recipient: '', message: '' };

    if (resultCode === 0) {
      const callbackItems = stkCallback.CallbackMetadata?.Item || [];
      const receiptItem = callbackItems.find((item: any) => item.Name === 'MpesaReceiptNumber');
      const mpesaReceiptNumber = receiptItem?.Value;

      this.logger.log(`✅ Payment SUCCESS verification sequence processing for transaction row reference: ${existingTx.id}`);

      await this.prisma['$transaction'](async (tx: any) => {
        await tx['mpesaTransaction'].update({
          where: { id: existingTx.id },
          data: {
            status: PaymentStatus.SUCCESS, 
            mpesaReceiptNumber,
            rawCallbackDump: payload,
          },
        });

        const invoice = await tx['feeInvoice'].findUnique({
          where: { id: existingTx.invoiceId },
        });

        if (invoice) {
          const cleanAmountPaid = Number(existingTx.amount);
          const currentPaidTotal = Number(invoice.paid_amount);
          const invoiceTotalRequired = Number(invoice.total_amount);
          const finalPaidSum = currentPaidTotal + cleanAmountPaid;
          
          let invoiceAccountingStatus: 'PAID' | 'PARTIAL' = 'PARTIAL';
          if (finalPaidSum >= invoiceTotalRequired) {
            invoiceAccountingStatus = 'PAID';
          }

          await tx['feeInvoice'].update({
            where: { id: invoice.id },
            data: {
              paid_amount: finalPaidSum,
              status: invoiceAccountingStatus,
            },
          });

          const paymentLedger = await tx['feePayment'].create({
            data: {
              campus_id: existingTx.campusId,
              fee_invoice_id: invoice.id,
              amount: existingTx.amount,
              payment_mode: 'MPESA', 
              mpesa_trans_id: mpesaReceiptNumber,
              payment_date: new Date(),
            },
          });

          const cleanReceiptSlug = `REC-${mpesaReceiptNumber || crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          await tx['paymentReceipt'].create({
            data: {
              campus_id: existingTx.campusId,
              fee_payment_id: paymentLedger.id,
              receipt_number: cleanReceiptSlug,
            },
          });
          
          // 👤 Casing-agnostic student profiling context query injection
          const studentModelName = ['student', 'Student', 'students'].find(m => typeof tx[m] !== 'undefined') || 'student';
          const student = await tx[studentModelName].findUnique({
            where: { id: existingTx.studentId },
          });
          
          const studentName = student ? `${student.firstName ?? student.first_name ?? ''}`.trim() : 'Student';
          const currentOutstandingBalance = Math.max(0, invoiceTotalRequired - finalPaidSum);

          // 📝 Compile localized message templates securely
          smsPayload = {
            campusId: existingTx.campusId,
            recipient: existingTx.phoneNumber,
            message: `Scholarax: KES ${cleanAmountPaid.toLocaleString()}.00 received via M-Pesa (${mpesaReceiptNumber}) for ${studentName}. New Invoice Status: ${invoiceAccountingStatus}. Balance: KES ${currentOutstandingBalance.toLocaleString()}.00. Thank you!`,
          };
          sendSmsConfirmation = true;

          this.logger.log(`📊 Ledger updated successfully: Invoice ${invoice.id} state adjusted to ${invoiceAccountingStatus}.`);
        } else {
          this.logger.warn(`⚠️ FeeInvoice reference ${existingTx.invoiceId} not found during ledger processing.`);
        }

        await tx['paymentAuditTrail'].create({
          data: {
            campusId: existingTx.campusId,
            action: 'MPESA_PAYMENT_CALLBACK_SUCCESS',
            ipAddress,
            details: { 
              checkoutRequestId, 
              mpesaReceiptNumber,
              invoiceId: existingTx.invoiceId,
              studentId: existingTx.studentId 
            },
          },
        });
      });

      // 📱 Trigger outbound notification securely following the transaction lifecycle context execution
      if (sendSmsConfirmation) {
        try {
          await this.smsService.sendSms(smsPayload.campusId, smsPayload.recipient, smsPayload.message);
          this.logger.log(`📱 Automated SMS payment confirmation successfully dispatched to ${smsPayload.recipient}`);
        } catch (smsErr: any) {
          this.logger.error(`[SMS_ORCHESTRATION_ERROR] Real-time text transmission skipped: ${smsErr.message}`);
        }
      }

    } else {
      this.logger.warn(`❌ SAD PATH WEBHOOK RETRIEVED! ResultCode: ${resultCode} | Reason: ${stkCallback.ResultDesc || 'Decline operations registered.'}`);

      await this.prisma['$transaction'](async (tx: any) => {
        await tx['mpesaTransaction'].update({
          where: { id: existingTx.id },
          data: {
            status: PaymentStatus.FAILED, 
            failureReason: stkCallback.ResultDesc || 'Transaction execution declined by client handset hardware.',
            rawCallbackDump: payload,
          },
        });

        await tx['paymentAuditTrail'].create({
          data: {
            campusId: existingTx.campusId,
            action: 'MPESA_PAYMENT_CALLBACK_FAILED',
            ipAddress,
            details: { checkoutRequestId, resultCode, description: stkCallback.ResultDesc },
          },
        });
      });
    }
  }

  async getTransactionStatus(checkoutRequestId: string) {
    const transaction = await this.prisma['mpesaTransaction'].findUnique({
      where: { checkoutRequestId },
      select: {
        status: true,
        failureReason: true,
        mpesaReceiptNumber: true,
        amount: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('The requested transaction tracking code could not be identified.');
    }

    return transaction;
  }
}