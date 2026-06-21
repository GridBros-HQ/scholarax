import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client'; // 🛡️ Added for strict schema validation safety
import * as crypto from 'crypto';

export interface StkPushInitiateDto {
  amount: number;
  phoneNumber: string;
  studentId: string;
  invoiceId: string;
}

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly CRYPTO_KEY = Buffer.from('test_secret_key_must_be_thirty_two_bytes_long'.slice(0, 32));
  private readonly ALGORITHM = 'aes-256-gcm';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🔓 Decrypts data fields stored securely inside database clusters
   */
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

  /**
   * 🚀 Broadcasts a live STK Push Request out to the Safaricom Daraja Network Staging Gateway
   */
  async initiateStkPush(dto: StkPushInitiateDto, campusId: string, userId: string, ipAddress: string): Promise<any> {
    // 1. Fetch encrypted campus configurations via the custom prisma.client instance
    const config = await this.prisma.client.paymentGatewayConfig.findUnique({
      where: { campusId },
    });

    if (!config) {
      throw new NotFoundException('M-Pesa payment integration is not configured for this campus context.');
    }

    // 2. Clear credentials mapping layers in memory safely
    const rawShortcode = config.shortCode;
    const rawKey = this.decrypt(config.consumerKey);
    const rawSecret = this.decrypt(config.consumerSecret);
    const rawPasskey = this.decrypt(config.passkey);

    // 3. Complete the live OAuth authentication handshake with Safaricom
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

    // 4. Synthesize the transaction timestamp parameters
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14); // YYYYMMDDHHmmss
    const password = Buffer.from(`${rawShortcode}${rawPasskey}${timestamp}`).toString('base64');

    // 5. Fire off the live request directly to Safaricom's web gateway servers
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

    // 6. Persist transaction context via the extended engine transaction allocator
    return await this.prisma.client.$transaction(async (tx: any) => {
      const txRecord = await tx.mpesaTransaction.create({
        data: {
          campusId,
          studentId: dto.studentId,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          phoneNumber: dto.phoneNumber,
          checkoutRequestId: stkData.CheckoutRequestID,
          merchantRequestId: stkData.MerchantRequestID,
          status: PaymentStatus.PENDING, // 🔄 Swapped raw text string for Prisma Enum mapping
        },
      });

      await tx.paymentAuditTrail.create({
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

  /**
   * 📥 Processes incoming authenticated webhooks returning from Safaricom's cloud servers
   */
  async handleWebhookCallback(payload: any, ipAddress: string): Promise<void> {
    // 📢 Telemetry Injection Boundary: Log all inbound raw packet streams immediately
    this.logger.log(`📥 Webhook intercepted! Raw Safaricom Payload: ${JSON.stringify(payload)}`);

    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback) {
      throw new BadRequestException('Malformed or unrecognizable transaction callback payload footprint intercepted.');
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    // Find tracking row using the custom client engine interface
    const existingTx = await this.prisma.client.mpesaTransaction.findUnique({
      where: { checkoutRequestId },
    });

    if (!existingTx) {
      this.logger.error(`CRITICAL WARNING: Unidentified checkout request callback key intercepted: ${checkoutRequestId}`);
      throw new NotFoundException('Transaction execution tracking context target reference mismatch.');
    }

    // Process payment success metadata
    if (resultCode === 0) {
      const callbackItems = stkCallback.CallbackMetadata?.Item || [];
      const receiptItem = callbackItems.find((item: any) => item.Name === 'MpesaReceiptNumber');
      const mpesaReceiptNumber = receiptItem?.Value;

      // 📢 Active Success Tracker
      this.logger.log(`✅ Payment SUCCESS verification sequence processing for transaction row reference: ${existingTx.id}`);

      await this.prisma.client.$transaction(async (tx: any) => {
        // 1. Update core Mpesa log entry status
        await tx.mpesaTransaction.update({
          where: { id: existingTx.id },
          data: {
            status: PaymentStatus.SUCCESS, 
            mpesaReceiptNumber,
            rawCallbackDump: payload,
          },
        });

        // 2. Fetch the target invoice to see current balances
        const invoice = await tx.feeInvoice.findUnique({
          where: { id: existingTx.invoiceId },
        });

        if (invoice) {
          // Calculate new paid total safely combining fields as numbers
          const cleanAmountPaid = Number(existingTx.amount);
          const currentPaidTotal = Number(invoice.paid_amount);
          const invoiceTotalRequired = Number(invoice.total_amount);
          
          const finalPaidSum = currentPaidTotal + cleanAmountPaid;
          
          // Determine accounting validation state mapping to InvoiceStatus enum
          let invoiceAccountingStatus: 'FULLY_PAID' | 'PARTIALLY_PAID' = 'PARTIALLY_PAID';
          if (finalPaidSum >= invoiceTotalRequired) {
            invoiceAccountingStatus = 'FULLY_PAID';
          }

          // Update school invoice row data balances
          await tx.feeInvoice.update({
            where: { id: invoice.id },
            data: {
              paid_amount: finalPaidSum,
              status: invoiceAccountingStatus,
            },
          });

          // 3. Post a clean entry to the FeePayment ledger matrix
          const paymentLedger = await tx.feePayment.create({
            data: {
              campus_id: existingTx.campusId,
              fee_invoice_id: invoice.id,
              amount: existingTx.amount,
              payment_mode: 'MPESA', // Maps directly to your PaymentMode schema enum
              mpesa_trans_id: mpesaReceiptNumber,
              payment_date: new Date(),
            },
          });

          // 4. Mint an official system wide PaymentReceipt string
          const cleanReceiptSlug = `REC-${mpesaReceiptNumber || crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          await tx.paymentReceipt.create({
            data: {
              campus_id: existingTx.campusId,
              fee_payment_id: paymentLedger.id,
              receipt_number: cleanReceiptSlug,
            },
          });
          
          this.logger.log(`📊 Ledger updated successfully: Invoice ${invoice.id} state adjusted to ${invoiceAccountingStatus}.`);
        } else {
          this.logger.warn(`⚠️ FeeInvoice reference ${existingTx.invoiceId} not found during ledger processing.`);
        }

        // 5. Append records to system audit trail boundaries
        await tx.paymentAuditTrail.create({
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
    } else {
      // 📢 Active Sad Path Warning Tracker
      this.logger.warn(`❌ SAD PATH WEBHOOK RETRIEVED! ResultCode: ${resultCode} | Reason: ${stkCallback.ResultDesc || 'Decline operations registered.'}`);

      // Process transaction rejection or customer cancel operations
      await this.prisma.client.$transaction(async (tx: any) => {
        await tx.mpesaTransaction.update({
          where: { id: existingTx.id },
          data: {
            status: PaymentStatus.FAILED, // 🔄 Swapped raw text string for Prisma Enum mapping
            failureReason: stkCallback.ResultDesc || 'Transaction execution declined by client handset hardware.',
            rawCallbackDump: payload,
          },
        });

        await tx.paymentAuditTrail.create({
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

  /**
   * 🔍 Fetches the current processing state of an active transaction row for UI short-polling
   */
  async getTransactionStatus(checkoutRequestId: string) {
    const transaction = await this.prisma.client.mpesaTransaction.findUnique({
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