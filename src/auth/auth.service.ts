import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // This clean getter tells TypeScript to allow dynamic access to your 37 schema tables via the wrapper
  private get prisma() {
    return (this.prismaService as any);
  }

  async register(data: any) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException('A user account with this email address already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        roles: data.roles || ['STUDENT'],
        campusId: data.campusId,
      },
      select: { id: true, email: true, roles: true, campusId: true },
    });
  }

  async login(credentials: any) {
    const user = await this.prisma.user.findUnique({ where: { email: credentials.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials provided');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials provided');
    }

    const payload = { sub: user.id, email: user.email, roles: user.roles, campusId: user.campusId };
    return { access_token: this.jwtService.sign(payload) };
  }
}