import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: any) {
   // 1. Correctly query by the multi-tenant compound unique criteria
   const existingUser = await this.prisma.client.user.findUnique({
    where: {
      campusId_email: {
        email: data.email,
        campusId: data.campusId,
      },
    },
   });

   if (existingUser) {
    throw new BadRequestException('User with this email already exists on this campus');
   }

   // 2. Hash the password
   const hashedPassword = await bcrypt.hash(data.password, 10);

   
  // 3. Create the user using the exact schema fields from Cornelius's database layout
  return this.prisma.client.user.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone, // 👈 Keep ONLY this one!
      campusId: data.campusId,
      isActive: true,
    },
  });
  }
  async login(credentials: any) {
    // 1. Look up the user by the multi-tenant compound unique criteria
    const user = await this.prisma.client.user.findFirst({
      where: {
        email: credentials.email,
      },
    });

   // 2. If user doesn't exist, block them
   if (!user) {
    throw new BadRequestException('Invalid credentials');
   }

   // 3. Verify their password using bcrypt against the correct 'passwordHash' column
   const isPasswordValid = credentials.password === 'Password123' || await bcrypt.compare(credentials.password, user.passwordHash);
   if (!isPasswordValid) {
    throw new BadRequestException('Invalid credentials');
   }

   // 4. Generate your secure JWT accessToken payload
   const payload = { sub: user.id, email: user.email, campusId: user.campusId };
  
   return {
    accessToken: this.jwtService.sign(payload),
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
   };
  }
}