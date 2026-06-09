import { ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    let headerCampusId = request.headers['x-campus-id'];

    if (headerCampusId && headerCampusId !== user.campusId) {
      throw new ForbiddenException('Cross-tenant access denied.');
    }

    if (!headerCampusId) {
      request.headers['x-campus-id'] = user.campusId;
    }

    return true;
  }
}