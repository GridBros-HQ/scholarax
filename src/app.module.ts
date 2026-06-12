import { ProfilesModule } from './profiles/profiles.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { envValidationSchema } from './config/env.validation';
import { InventoryModule } from './inventory/inventory.module';
import { AuditLogModule } from './audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      cache: true,
    }),
    PrismaModule,
    AuthModule,
    CampusModule,
<<<<<<< Updated upstream
    InventoryModule,
    AuditLogModule,
=======
    ProfilesModule,
>>>>>>> Stashed changes
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}