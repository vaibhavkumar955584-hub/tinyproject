import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });
dotenv.config({ path: path.join(projectRoot, '.env') });
// Neon provides DATABASE_URL for pooled runtime queries and DATABASE_URL_UNPOOLED for migrations.
const migrationUrl = process.env.DATABASE_URL_UNPOOLED?.trim() || env('DATABASE_URL');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url: migrationUrl },
});
