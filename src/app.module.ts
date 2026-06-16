import { ProfilesModule } from './profiles/profiles.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { envValidationSchema } from './config/env.validation';
import { InventoryModule } from './inventory/inventory.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { RolesModule } from './roles/roles.module';
import { ClassesModule } from './classes/classes.module';
import { StreamsModule } from './streams/streams.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { SubjectsModule } from './subjects/subjects.module';
import { StudentsModule } from './students/students.module';

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
    InventoryModule,
    AuditLogModule,
    ProfilesModule,
    RolesModule,
    ClassesModule,
    StreamsModule,
    AcademicYearsModule,
    SubjectsModule,
    StudentsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}