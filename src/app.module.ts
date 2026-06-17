import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { envValidationSchema } from './config/env.validation';
import { InventoryModule } from './inventory/inventory.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RolesModule } from './roles/roles.module';
import { ClassesModule } from './classes/classes.module';
import { StreamsModule } from './streams/streams.module';
import { AcademicYearsModule } from './academic-years/academic-years.module'; 
import { SubjectsModule } from './subjects/subjects.module';
import { TimetableModule } from './timetable/timetable.module';
import { AttendanceModule } from './attendance/attendance.module';
// 👇 Both of your new modules now live in harmony here
import { AssessmentModule } from './assessment/assessment.module';
import { GradesModule } from './grades/grades.module';
import { GradingScaleModule } from './grading-scale/grading-scale.module';


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
    TimetableModule,
    AttendanceModule,
    AssessmentModule, // 📑 Your Framework
    GradesModule,     // 📝 His Grading Engine
    GradingScaleModule, // 📊 Her Grading Scale
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}