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

seed().finally(() => prisma.$disconnect());
