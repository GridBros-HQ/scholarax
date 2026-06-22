import 'dotenv/config'; // MUST BE FIRST: Injects DATABASE_URL before Prisma initializes
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, CurriculumType } from '@prisma/client';

// Prisma 7 strictly requires either a Driver Adapter or an Accelerate URL.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in your environment variables.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding pipeline...');

  // 1. Establish Root School Group Portfolio Node
  const schoolGroupId = '00000000-0000-0000-0000-000000000001';
  console.log(`Checking for root group organization...`);
  
  const schoolGroup = await prisma.schoolGroup.upsert({
    where: { slug: 'scholarax-education-group' },
    update: {},
    create: {
      id: schoolGroupId,
      slug: 'scholarax-education-group',
      name: 'Scholarax Education Group',
    },
  });
  console.log(`✔ School Group established (ID: ${schoolGroup.id})`);

  // 2. Deploy Sibling Campuses (Primary & Secondary Nodes) using compound keys
  console.log('Deploying isolated campus business units...');
  
  const primaryCampusId = '10000000-0000-0000-0000-000000000001';
  const primaryCampus = await prisma.campus.upsert({
    where: {
      schoolGroupId_code: {
        schoolGroupId: schoolGroup.id,
        code: 'SCH-PRI',
      },
    },
    update: {},
    create: {
      id: primaryCampusId,
      schoolGroupId: schoolGroup.id,
      name: 'Scholarax Primary School (CBC)',
      code: 'SCH-PRI',
      curriculumType: CurriculumType.CBC,
    },
  });

  const secondaryCampusId = '20000000-0000-0000-0000-000000000001';
  const secondaryCampus = await prisma.campus.upsert({
    where: {
      schoolGroupId_code: {
        schoolGroupId: schoolGroup.id,
        code: 'SCH-SEC',
      },
    },
    update: {},
    create: {
      id: secondaryCampusId,
      schoolGroupId: schoolGroup.id,
      name: 'Scholarax High School (KCSE)',
      code: 'SCH-SEC',
      curriculumType: CurriculumType.KCSE,
    },
  });
  console.log(`✔ Sibling campuses active. Primary: ${primaryCampus.id} | Secondary: ${secondaryCampus.id}`);

  // 3. Seed Campus-Scoped Authorization Roles
  const targetRoles = [
    { name: 'Administrator', slug: 'administrator' },
    { name: 'Teacher', slug: 'teacher' },
    { name: 'Bursar', slug: 'bursar' },
    { name: 'Parent', slug: 'parent' },
    { name: 'Student', slug: 'student' },
  ];

  console.log(`Mapping secure access tokens for localized roles...`);
  for (const role of targetRoles) {
    await prisma.role.upsert({
      where: {
        campusId_slug: {
          campusId: primaryCampus.id,
          slug: role.slug,
        },
      },
      update: {},
      create: {
        campusId: primaryCampus.id,
        name: role.name,
        slug: role.slug,
        description: `Localized access permissions grouping for ${role.name} operations.`,
      },
    });
  }
  console.log('✔ Operational roles successfully initialized.');

  // 4. Provision Bootstrap Administrator Core Profile
  const adminEmail = 'admin@scholarax.com';
  console.log(`Provisioning bootstrap administrative profile: ${adminEmail}`);
  
  const adminUser = await prisma.user.upsert({
    where: {
      campusId_email: {
        campusId: primaryCampus.id,
        email: adminEmail,
      },
    },
    update: {},
    create: {
      campusId: primaryCampus.id,
      firstName: 'System',
      lastName: 'Administrator',
      email: adminEmail,
      phone: '+254700000000',
      passwordHash: '$2b$10$EPf9Z3N19zS0A.38PAnNve2/M9RzKk.q6D/3g5M21a6KjO8dC2d6O', // Baseline mock identity hash
      isActive: true,
    },
  });

  // 5. Connect Admin User to the Localized Administrator Role Type
  const adminRole = await prisma.role.findUnique({
    where: {
      campusId_slug: {
        campusId: primaryCampus.id,
        slug: 'administrator',
      },
    },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_campusId: {
          userId: adminUser.id,
          roleId: adminRole.id,
          campusId: primaryCampus.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
        campusId: primaryCampus.id,
      },
    });
    console.log('✔ Security mapping successfully attached.');
  }

  // ========================================================
  // 📈 PHASE 5: OPERATIONAL ACADEMICS & FINANCIAL TIMELINES
  // ========================================================
  console.log('\nDeploying operational academic tracks and schedules...');

  // 6. Seed Academic Year & Term Context
  let academicYear = await prisma['academicYear'].findFirst({
    where: { name: 'Academic Year 2026', campus: { id: primaryCampus.id } }
  });
  if (!academicYear) {
    academicYear = await prisma['academicYear'].create({
      data: { 
        name: 'Academic Year 2026', 
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-12-31'),
        campus_id: primaryCampus.id
      }
    });
  }

  let termOne = await prisma['term'].findFirst({
    where: { name: '2026 - Term 1', campus: { id: primaryCampus.id } }
  });
  if (!termOne) {
    termOne = await prisma['term'].create({
      data: { 
        name: '2026 - Term 1', 
        start_date: new Date('2026-01-05'),
        end_date: new Date('2026-04-03'),
        academic_year: { connect: { id: academicYear.id } },
        campus: { connect: { id: primaryCampus.id } } 
      }
    });
  }
  console.log(`✔ Academic calendars bound to calendar frame.`);

  // 7. Seed Class and Stream Allocations
  let classGrade8 = await prisma['class'].findFirst({
    where: { name: 'Grade 8', campus: { id: primaryCampus.id } }
  });
  if (!classGrade8) {
    classGrade8 = await prisma['class'].create({
      data: { 
        name: 'Grade 8', 
        track_type: CurriculumType.CBC,
        campus: { connect: { id: primaryCampus.id } }
      }
    });
  }

  let stream8East = await prisma['stream'].findFirst({
    where: { name: 'Grade 8 East', campus: { id: primaryCampus.id } }
  });
  if (!stream8East) {
    stream8East = await prisma['stream'].create({
      data: { 
        name: 'Grade 8 East', 
        capacity: 45, 
        campus: { connect: { id: primaryCampus.id } },
        class: { connect: { id: classGrade8.id } } 
      }
    });
  }
  console.log(`✔ Structural classroom paths successfully routed.`);

  // 8. Seed Core Fee Components and Packages
  console.log('Compiling campus financial fee architectures...');
  
  let tuitionComp = await prisma['feeComponent'].findFirst({
    where: { name: 'Base Tuition Fee', campusId: primaryCampus.id }
  });
  if (!tuitionComp) {
    tuitionComp = await prisma['feeComponent'].create({
      data: { 
        name: 'Base Tuition Fee', 
        amount: 35000.00,
        campusId: primaryCampus.id
      }
    });
  }

  let transportComp = await prisma['feeComponent'].findFirst({
    where: { name: 'School Bus Transport', campusId: primaryCampus.id }
  });
  if (!transportComp) {
    transportComp = await prisma['feeComponent'].create({
      data: { 
        name: 'School Bus Transport', 
        amount: 5000.00,
        campusId: primaryCampus.id
      }
    });
  }

  let primaryFeePackage = await prisma['feePackage'].findFirst({
    where: { campusId: primaryCampus.id }
  });
  if (!primaryFeePackage) {
    primaryFeePackage = await prisma['feePackage'].create({
      data: { 
        campusId: primaryCampus.id
      }
    });
  }

  // Attach Components to the Package ruleset via cross-relation unique fields
  await prisma['feePackageItem'].upsert({
    where: {
      feePackageId_feeComponentId: {
        feePackageId: primaryFeePackage.id,
        feeComponentId: tuitionComp.id
      }
    },
    update: {},
    create: {
      feePackageId: primaryFeePackage.id,
      feeComponentId: tuitionComp.id
    }
  });

  await prisma['feePackageItem'].upsert({
    where: {
      feePackageId_feeComponentId: {
        feePackageId: primaryFeePackage.id,
        feeComponentId: transportComp.id
      }
    },
    update: {},
    create: {
      feePackageId: primaryFeePackage.id,
      feeComponentId: transportComp.id
    }
  });
  console.log(`✔ Financial package configuration locked (Base Price: 40,000.00).`);

  // 9. Provision Mock Student Accounts mapped to the tracking nodes
  console.log('Injecting active student profiles into localized classroom streams...');
  const mockStudents = [
    { admissionNumber: 'SCH/2026/0001', firstName: 'Omari', lastName: 'Kipleting' },
    { admissionNumber: 'SCH/2026/0002', firstName: 'Amara', lastName: 'Nanjala' },
    { admissionNumber: 'SCH/2026/0003', firstName: 'Jabari', lastName: 'Mwangi' }
  ];

  for (const student of mockStudents) {
    const existingStudent = await prisma['student'].findFirst({
      where: { admission_number: student.admissionNumber }
    });

    if (!existingStudent) {
      await prisma['student'].create({
        data: {
          campus_id: primaryCampus.id,
          stream_id: stream8East.id,
          admission_number: student.admissionNumber,
          first_name: student.firstName,
          last_name: student.lastName,
          date_of_birth: new Date('2012-04-18'),
          gender: 'UNKNOWN',
          enrollment_date: new Date(),
          status: 'ACTIVE'
        }
      });
    }
  }

  console.log('\n========================================================');
  console.log('🎉 SYSTEM SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`🏢 Group Organization Node ID: ${schoolGroup.id}`);
  console.log(`🧒 Primary Campus Branch ID:   ${primaryCampus.id}`);
  console.log(`🎓 Secondary Campus Branch ID: ${secondaryCampus.id}`);
  console.log(`⏱️ Loaded Active Term ID:      ${termOne.id}`);
  console.log(`🏷️ Loaded Class Allocation ID: ${classGrade8.id}`);
  console.log(`📦 Loaded Fee Package ID:      ${primaryFeePackage.id}`);
  console.log(`👤 Active Bootstrap Admin:     ${adminUser.email}`);
  console.log('========================================================');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Data pipeline seeding failed due to error:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });