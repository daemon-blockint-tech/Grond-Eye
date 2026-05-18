import { type FullConfig } from '@playwright/test';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createRequire } from 'node:module';

export const TEST_USER_EMAIL = 'playwright-test@worldwideview.local';

const require = createRequire(import.meta.url);
const { loadEnvFiles, getDatabaseUrl } = require('../scripts/load-env.mjs') as {
  loadEnvFiles: (cwd?: string) => void;
  getDatabaseUrl: () => string;
};

async function globalTeardown(config: FullConfig) {
  loadEnvFiles();
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  console.log(`[Teardown] Cleaning up test user: ${TEST_USER_EMAIL}`);
  try {
      console.log(`[Teardown] Cleaning up mock plugin...`);
      await prisma.installedPlugin.deleteMany({
          where: { pluginId: 'e2e-mock-plugin' }
      });
      await prisma.user.deleteMany({
        where: { email: TEST_USER_EMAIL },
      });
  } catch (e) {
      console.error(`[Teardown] Failed to delete test user:`, e);
  } finally {
      await prisma.$disconnect();
      await pool.end();
  }
}

export default globalTeardown;
