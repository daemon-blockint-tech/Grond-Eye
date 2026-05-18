/**
 * @file load-env.mjs
 * @description Loads `.env` and `.env.local` into process.env for Node scripts (Playwright, boot).
 */

import fs from "fs";
import path from "path";

/**
 * Parses a single KEY=value line into process.env.
 * @param {string} line - Raw line from an env file.
 */
function applyEnvLine(line) {
    if (!line || line.trim().startsWith("#")) return;
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) return;
    const key = match[1];
    let value = match[2] ?? "";
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
        || (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        value = trimmed.slice(1, -1);
    }
    process.env[key] = value;
}

/**
 * Loads `.env` then `.env.local` (later files override).
 * @param {string} [cwd] - Project root.
 */
export function loadEnvFiles(cwd = process.cwd()) {
    for (const file of [".env", ".env.local"]) {
        const envPath = path.resolve(cwd, file);
        if (!fs.existsSync(envPath)) continue;
        const content = fs.readFileSync(envPath, "utf8");
        for (const line of content.split(/\r?\n/)) {
            applyEnvLine(line);
        }
    }
    sanitizeDatabaseUrl();
}

/**
 * Repairs DATABASE_URL when AUTH_SECRET was accidentally concatenated on the same line.
 */
export function sanitizeDatabaseUrl() {
    const url = process.env.DATABASE_URL;
    if (!url || !url.includes("AUTH_SECRET=")) return;
    const idx = url.indexOf("AUTH_SECRET=");
    let cleaned = url.slice(0, idx).trim();
    if (cleaned.endsWith('"')) cleaned = cleaned.slice(0, -1);
    if (cleaned.startsWith('"')) cleaned = cleaned.slice(1);
    process.env.DATABASE_URL = cleaned;
}

const DEFAULT_DATABASE_URL =
    "postgresql://postgres:postgres@127.0.0.1:5432/grond?schema=public";

/**
 * Returns a valid Postgres connection string for local tooling.
 * @returns {string}
 */
export function getDatabaseUrl() {
    loadEnvFiles();
    return process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
}
