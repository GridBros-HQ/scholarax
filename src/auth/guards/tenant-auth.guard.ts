import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TenantSessionPayload } from 'src/auth/interfaces/tenant-session.interface';

@Injectable()
export class TenantAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing.');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization format must be "Bearer <token>".');
    }

    try {
      // Dynamic verification fallback using system environment context
      const secret = process.env.JWT_SECRET || 'fallback_development_secret_key';
      const decoded = jwt.verify(token, secret) as TenantSessionPayload;

      if (!decoded.campusId) {
        throw new UnauthorizedException('Security Context Failure: Token lacks an assigned tenant campus ID scope.');
      }

      // Attach context payloads cleanly to the incoming request object
      request['user'] = decoded;
      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Authentication failed: Provided session token has expired.');
      }
      throw new UnauthorizedException('Authentication failed: Signature verification rejected.');
    }
  }
}