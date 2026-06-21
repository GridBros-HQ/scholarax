export interface TenantSessionPayload {
  userId: string;
  email: string;
  roles: string[];
  campusId: string;
}

export interface StkPushInitiateDto {
  studentId: string;
  invoiceId: string;
  amount: number;
  phoneNumber: string; // Format: 2547XXXXXXXX
}

export interface SafaricomCallbackPayload {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: any;
        }>;
      };
    };
  };
}