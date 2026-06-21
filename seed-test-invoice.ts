import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Universal targets mapped to your test universe configurations
const CAMPUS_ID = '00000000-0000-0000-0000-000000000000';
const INVOICE_ID = '55555555-5555-5555-5555-555555555555';
const STUDENT_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  console.log('⏳ Running safe automated ledger instantiation routines...');

  // 1. Core Academic Year Setup
  const academicYear = await prisma.academicYear.upsert({
    where: { campus_id_name: { campus_id: CAMPUS_ID, name: '2026 Academic Year' } },
    update: {},
    create: {
      campus_id: CAMPUS_ID,
      name: '2026 Academic Year',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-12-31'),
      is_active: true,
    },
  });

  // 2. Academic Term Setup
  const term = await prisma.term.create({
    data: {
      campus_id: CAMPUS_ID,
      academic_year_id: academicYear.id,
      name: 'Term 1 Test Scope',
      start_date: new Date('2026-01-01'),
      end_date: new Date('2026-04-30'),
      is_active: true,
    },
  });

  // 3. Class Structure Setup
  const targetClass = await prisma.class.upsert({
    where: { campus_id_name: { campus_id: CAMPUS_ID, name: 'Grade 1 Staging' } },
    update: {},
    create: {
      campus_id: CAMPUS_ID,
      name: 'Grade 1 Staging',
      track_type: 'CBC',
    },
  });

  // 4. Stream Allocation Setup
  const stream = await prisma.stream.upsert({
    where: { class_id_name: { class_id: targetClass.id, name: 'East Room' } },
    update: {},
    create: {
      campus_id: CAMPUS_ID,
      class_id: targetClass.id,
      name: 'East Room',
      capacity: 40,
    },
  });

  // 5. Test Student Setup
  await prisma.student.upsert({
    where: { id: STUDENT_ID },
    update: {},
    create: {
      id: STUDENT_ID,
      campus_id: CAMPUS_ID,
      stream_id: stream.id,
      admission_number: 'SCH-2026-0001',
      first_name: 'Cornellious',
      last_name: 'Test Pilot',
      date_of_birth: new Date('2018-05-12'),
      gender: 'Male',
      enrollment_date: new Date('2026-01-01'),
      status: 'ACTIVE',
    },
  });

  // 6. Perfect Relational Fee Invoice Generation
  await prisma.feeInvoice.upsert({
    where: { id: INVOICE_ID },
    update: {},
    create: {
      id: INVOICE_ID,
      campus_id: CAMPUS_ID,
      student_id: STUDENT_ID,
      term_id: term.id,
      total_amount: 5000.00,
      paid_amount: 0.00,
      status: 'UNPAID',
    },
  });

  console.log('\n━━━━━━━ SEED RESULTS ━━━━━━━');
  console.log(`✅ Student Instantiated (ID): ${STUDENT_ID}`);
  console.log(`✅ Fee Invoice Instantiated (ID): ${INVOICE_ID}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((err) => {
    console.error('❌ Automation script crashed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });