import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TenantSessionPayload } from '../interfaces/tenant-session.interface';

export const CurrentCampus = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request['user'] as TenantSessionPayload;

    if (!user || !user.campusId) {
      throw new UnauthorizedException('Tenant extraction error: No validated campus security context found for this request pipeline.');
    }

    return user.campusId;
  },
);