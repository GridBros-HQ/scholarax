import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext } from '../../prisma/tenant-context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Extract the 'x-campus-id' header, defaulting to null if missing
    const campusId = request.headers['x-campus-id'] || null;

    // Wrap the downstream RxJS execution handler inside our tenant context
    return tenantContext.run({ campusId }, () => next.handle());
  }
}