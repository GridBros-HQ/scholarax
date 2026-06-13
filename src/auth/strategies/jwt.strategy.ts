import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_key_for_scholarax_local_testing_2026',
    });
  }

  async validate(payload: any) {
    // Bypass the RLS query filter by accessing the un-extended database instance
    const client = (this.prisma as any).baseClient || this.prisma;
    
    const user = await client.user.findUnique({
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
