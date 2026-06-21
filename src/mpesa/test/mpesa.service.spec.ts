import { Test, TestingModule } from '@nestjs/testing';
import { MpesaService } from '../mpesa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MpesaService Payment Engine Verification Suite', () => {
  let service: MpesaService;
  let prisma: PrismaService;

  const mockPrismaService = {
    client: {
      paymentGatewayConfig: { findUnique: jest.fn() },
      mpesaTransaction: { create: jest.fn(), update: jest.fn() },
      paymentAuditTrail: { create: jest.fn() },
    },
    rootClient: {
      mpesaTransaction: { findUnique: jest.fn() },
    },
  };

  beforeEach(async () => {
    process.env.PAYMENT_CRYPTO_KEY = 'test_secret_key_must_be_thirty_two_bytes_long';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MpesaService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MpesaService>(MpesaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should reject callback processing execution cleanly if tracking context token does not match', async () => {
    (prisma as any).rootClient.mpesaTransaction.findUnique.mockResolvedValue(null);

    const mockPayload = {
      Body: { stkCallback: { CheckoutRequestID: 'invalid_id', MerchantRequestID: 'm', ResultCode: 0, ResultDesc: 'Success' } }
    };

    await expect(service.handleWebhookCallback(mockPayload as any, '127.0.0.1'))
      .rejects.toThrow(NotFoundException);
  });
});