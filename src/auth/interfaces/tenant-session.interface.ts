export interface TenantSessionPayload {
  userId: string;
  email: string;
  campusId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}