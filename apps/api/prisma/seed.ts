import path from 'node:path';
import dotenv from 'dotenv';

// Load .env from workspace or monorepo root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: 'demo@tenderguard.local' },
    create: { email: 'demo@tenderguard.local' },
    update: {},
  });
  await prisma.businessProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      category: 'IT Services',
      state: 'Uttar Pradesh',
      annualTurnoverInr: 3_000_000n,
      experienceYears: 2,
      msmeStatus: 'SMALL',
      certifications: [],
      documentsHeld: ['PAN', 'GST Registration'],
    },
    update: {},
  });
}

seed()
  .catch((err) => {
    console.error('Prisma seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
