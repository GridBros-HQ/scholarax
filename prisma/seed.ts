import 'dotenv/config'; // MUST BE FIRST: Injects DATABASE_URL before Prisma initializes
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, CurriculumType } from '@prisma/client';

// Prisma 7 strictly requires either a Driver Adapter or an Accelerate URL.
// We use the PostgreSQL driver adapter here to read the standard DATABASE_URL.
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

  console.log('\n========================================================');
  console.log('🎉 SYSTEM SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`🏢 Group Organization Node ID: ${schoolGroup.id}`);
  console.log(`🧒 Primary Campus Branch ID:  ${primaryCampus.id}`);
  console.log(`🎓 Secondary Campus Branch ID: ${secondaryCampus.id}`);
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