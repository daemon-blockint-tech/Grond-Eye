/**
 * @file boot-db.mjs
 * @description Database bootstrapping utility.
 * Automates the startup of the local PostgreSQL container via Docker Compose 
 * and ensures the environment is ready for Prisma migrations.
 * @module scripts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load environment variables manually since dotenv might not be installed globally
/**
 * @function loadEnv
 * @description Manually parses a .env file into process.env to avoid 
 * external dependencies like 'dotenv' during early boot.
 */
const loadEnv = (file) => {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          // Remove quotes
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    // Ignore read errors
  }
};

loadEnv('.env');

const skipLocalDb = process.env.GROND_SKIP_LOCAL_DB === 'true' || process.env.GROND_SKIP_LOCAL_DB === '1' || process.env.WWV_SKIP_LOCAL_DB === 'true' || process.env.WWV_SKIP_LOCAL_DB === '1';

if (skipLocalDb) {
  console.log('⏭️ Skipping local PostgreSQL startup (GROND_SKIP_LOCAL_DB is set).');
  process.exit(0);
}

// Deterministic Port Assignment
const cwd = process.cwd();
const folderName = path.basename(cwd);
let port = 5432; // Default for main repo

if (folderName !== 'grond' && folderName !== 'worldwideview') {
  const hash = crypto.createHash('sha256').update(cwd).digest('hex');
  const portOffset = parseInt(hash.substring(0, 4), 16) % 1000;
  port = 5433 + portOffset;
}

process.env.GROND_DB_PORT = port.toString();
console.log(`🔌 Assigned deterministic database port: ${port}`);

// Robust rewrite of DATABASE_URL in .env
const envPath = path.resolve(cwd, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split(/\r?\n/);
  
  const targetUrl = `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${port}/grond?schema=public"`;
  const targetPortLine = `GROND_DB_PORT=${port}`;
  let foundTargetActive = false;
  let foundTargetPort = false;
  let linesModified = false;
  
  const newLines = lines.flatMap((line) => {
    if (/^\s*GROND_DB_PORT\s*=/.test(line)) {
      if (line.trim() === targetPortLine) {
        foundTargetPort = true;
        return [line];
      }
      linesModified = true;
      return [`# ${line}`];
    }
    // Repair corrupted line where AUTH_SECRET was glued to DATABASE_URL
    if (/^\s*DATABASE_URL\s*=/.test(line) && line.includes("AUTH_SECRET=")) {
      const idx = line.indexOf("AUTH_SECRET=");
      linesModified = true;
      return [line.slice(0, idx).trimEnd(), line.slice(idx)];
    }
    // Check if line is an active DATABASE_URL
    if (/^\s*DATABASE_URL\s*=/.test(line)) {
      if (line.trim() === targetUrl) {
        foundTargetActive = true;
        return [line];
      }
      console.warn(`⚠️  [Telemetry] Commenting out conflicting DATABASE_URL: ${line.trim()}`);
      linesModified = true;
      return [`# ${line}`];
    }
    return [line];
  });
  
  if (!foundTargetActive || !foundTargetPort) {
    console.log(`🔌 [Telemetry] Injecting local DATABASE_URL and GROND_DB_PORT=${port}.`);
    newLines.push(``);
    newLines.push(`# Dynamically injected by boot-db.mjs for worktree`);
    if (!foundTargetPort) newLines.push(targetPortLine);
    if (!foundTargetActive) newLines.push(targetUrl);
    linesModified = true;
  }
  
  if (linesModified) {
    const newContent = newLines.join('\n');
    
    // File write with retries and telemetry
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const payload = newContent.endsWith('\n') ? newContent : `${newContent}\n`;
        fs.writeFileSync(envPath, payload, 'utf8');
        break; // Success
      } catch (err) {
        attempt++;
        if (err.code === 'EBUSY' || err.code === 'EPERM' || err.message.includes('os error 32')) {
          console.warn(`⚠️  [Telemetry] File lock encountered on .env (attempt ${attempt}/${maxRetries}). Retrying in 100ms...`);
          if (attempt >= maxRetries) {
            console.error('❌ Failed to write .env after multiple attempts due to file locks.');
            throw err;
          }
          // Synchronous sleep since boot-db.mjs isn't currently inside an async IIFE
          const start = Date.now();
          while (Date.now() - start < 100) {}
        } else {
          throw err;
        }
      }
    }
  }
}


console.log('🚀 Checking local PostgreSQL database...');

try {
  // Check if docker is installed
  try {
    execSync('docker --version', { stdio: 'ignore' });
  } catch (e) {
    console.log('⚠️ Docker is not installed or not in PATH. Skipping local database startup.');
    console.log('💡 If you want to run a local database automatically, please install Docker Desktop.');
    process.exit(0);
  }

  // Start the db service and wait for it to be healthy
  console.log('📦 Starting PostgreSQL via Docker Compose...');
  execSync('docker compose up -d --wait db', { stdio: 'inherit' });

  console.log('✅ Local PostgreSQL database is ready!');

} catch (error) {
  console.error('❌ Failed to start local database:', error.message);
  console.log('💡 Ensure that docker is running and try again');
  console.log('💡 You may need to start it manually or set GROND_SKIP_LOCAL_DB=true to use an external database.');
}
