import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 1. Load local environment configurations
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL variable is missing from your .env file.');
  process.exit(1);
}

// 2. Instantiate native driver pooling mechanics
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 🔑 Sandbox Credentials Mapping Boundary
const CAMPUS_ID = '00000000-0000-0000-0000-000000000000'; 
const CONSUMER_KEY = 'b387RNpenK4w9lGWVEttPmFZGO25ROm1B2nursHHsExkclVc';
const CONSUMER_SECRET = 'klVxivYP3UCIzCV1VJ7oekEfWPjBgELQC3BMMD5XCqIySmzI2Cmucz4tXbXmQQgX';
const SHORTCODE = '174379'; 

// 👇 FIX: Applied the correct universal Safaricom Sandbox Passkey here
const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; 

const CRYPTO_KEY = Buffer.from('test_secret_key_must_be_thirty_two_bytes_long'.slice(0, 32));
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, CRYPTO_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${tag}`;
}

async function main() {
  console.log('Connecting to database via verified type-safe channels...');
  const groupId = '11111111-1111-1111-1111-111111111111';

  // 🏢 1. Ensure structural parent dependency group exists
  await prisma.schoolGroup.upsert({
    where: { id: groupId },
    update: {},
    create: {
      id: groupId,
      name: 'Scholarax System Group',
      slug: 'scholarax-group',
    },
  });

  // 🏫 2. Ensure test campus context exists
  await prisma.campus.upsert({
    where: { id: CAMPUS_ID },
    update: {},
    create: {
      id: CAMPUS_ID,
      name: 'Demo Testing Academy',
      code: 'MC-01',
      curriculumType: 'CBC' as any, // Casted to bypass raw enum loading checks safely
      schoolGroup: {
        connect: { id: groupId }
      },
    },
  });

  // 🛡️ 3. Save your M-Pesa credentials using the exact camelCase schema layout
  await (prisma as any).paymentGatewayConfig.upsert({
    where: { campusId: CAMPUS_ID },
    update: {
      shortCode: SHORTCODE,
      consumerKey: encrypt(CONSUMER_KEY),
      consumerSecret: encrypt(CONSUMER_SECRET),
      passkey: encrypt(PASSKEY),
    },
    create: {
      campusId: CAMPUS_ID,
      shortCode: SHORTCODE,
      consumerKey: encrypt(CONSUMER_KEY),
      consumerSecret: encrypt(CONSUMER_SECRET),
      passkey: encrypt(PASSKEY),
    },
  });

  console.log('✅ Success: Your test campus records and encrypted M-Pesa keys are officially seeded!');
}

main()
  .catch((err) => {
    console.error('❌ Seeding execution run halted due to error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });