import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  campusId: string | null;
}

// Global AsyncLocalStorage instance to hold the tenant context for each request
export const tenantContext = new AsyncLocalStorage<TenantContext>();
