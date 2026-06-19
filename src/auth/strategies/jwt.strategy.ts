import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 🛡️ CRITICAL SECURITY FIX: Throws an explicit initialization exception if secret environment key drops
      secretOrKey: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new InternalServerErrorException('CRITICAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing.');
        }
        return secret;
      })(),
    });
  }

  async validate(payload: any) {
    // 🛡️ SECURITY BYPASS FIXED: Removed the rogue .baseClient lookup attempt.
    // All profile lookups now go through our secure, proxy-protected transaction layer.
    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      campusId: payload.campusId,
    };
  }
}