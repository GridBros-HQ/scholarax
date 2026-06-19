import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext } from '../../prisma/tenant-context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Derive tenant campus context from the authenticated user token.
    const campusId = request.user?.campusId || request.user?.campus_id || null;

    return tenantContext.run({ campusId }, () => next.handle());
  }
}