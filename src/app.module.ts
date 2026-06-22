import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MpesaModule } from './mpesa/mpesa.module';
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
import { AssessmentModule } from './assessment/assessment.module';

// 💳 Phase 5 Financial Modules
import { FeeComponentsModule } from './fee-components/fee-components.module';
import { FeeStructuresModule } from './fee-structures/fee-structures.module';
import { FeeInvoicesModule } from './fee-invoices/fee-invoices.module';

// 🎓 Cornelius's New Academic Modules
import { GradesModule } from './grades/grades.module';
import { GradingScaleModule } from './grading-scale/grading-scale.module';
import { SmsModule } from './sms/sms.module'; 
import { ExpensesModule } from './expenses/expenses.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      cache: true,
    }),
    PrismaModule,
    MpesaModule,
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
    AssessmentModule,
    
    // Financial Stack Verified
    FeeComponentsModule,
    FeeStructuresModule,
    FeeInvoicesModule,   
    
    // Ingested Grading Stack
    GradesModule,     
    GradingScaleModule,
    SmsModule,
    ExpensesModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}