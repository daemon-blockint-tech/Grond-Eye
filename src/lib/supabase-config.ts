/**
 * @file supabase-config.ts
 * @description Resolves Supabase URL and API keys, preferring the local CLI stack in dev.
 */

import { edition } from "@/core/edition";

/** Default local Supabase API URL — must match `supabase/config.toml` `[api].port`. */
export const LOCAL_SUPABASE_URL = "http://127.0.0.1:54421";

/** Default local Postgres URL — must match `supabase/config.toml` `[db].port`. */
export const LOCAL_SUPABASE_DATABASE_URL =
    "postgresql://postgres:postgres@127.0.0.1:54422/postgres";

/**
 * Standard JWT keys emitted by `supabase start` for local development only.
 * @see https://supabase.com/docs/guides/cli/local-development
 */
export const LOCAL_SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const LOCAL_SUPABASE_SERVICE_ROLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nk0.EGIM96RAZx35lJzdJsyH-qQvRHR6iNth8OIetmNb2x0";

export interface ResolvedSupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    source: "local" | "env";
}

/**
 * Returns true when the URL points at a local Supabase CLI instance.
 */
export function isLocalSupabaseUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return (
            parsed.hostname === "127.0.0.1" ||
            parsed.hostname === "localhost" ||
            parsed.hostname === "host.docker.internal"
        );
    } catch {
        return false;
    }
}

/**
 * Whether to prefer `supabase start` endpoints over a hosted project URL.
 */
export function shouldPreferLocalSupabase(): boolean {
    const flag = process.env.SUPABASE_PREFER_LOCAL?.trim().toLowerCase();
    if (flag === "true" || flag === "1" || flag === "yes") return true;
    if (flag === "false" || flag === "0" || flag === "no") return false;
    return edition === "local" || process.env.NODE_ENV === "development";
}

/**
 * Resolves Supabase connection settings. Local stack wins when `shouldPreferLocalSupabase()`.
 */
export function resolveSupabaseConfig(): ResolvedSupabaseConfig | null {
    const explicitUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const explicitAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const explicitService = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (shouldPreferLocalSupabase()) {
        const localUrl = process.env.SUPABASE_LOCAL_URL?.trim() || LOCAL_SUPABASE_URL;
        return {
            url: explicitUrl && isLocalSupabaseUrl(explicitUrl) ? explicitUrl : localUrl,
            anonKey: explicitAnon || LOCAL_SUPABASE_ANON_KEY,
            serviceRoleKey: explicitService || LOCAL_SUPABASE_SERVICE_ROLE_KEY,
            source: "local",
        };
    }

    if (!explicitUrl || !explicitAnon) {
        return null;
    }

    return {
        url: explicitUrl,
        anonKey: explicitAnon,
        serviceRoleKey: explicitService || "",
        source: "env",
    };
}

/**
 * Optional Postgres URL for Prisma when using local Supabase instead of docker `db`.
 */
export function resolveSupabaseDatabaseUrl(): string | undefined {
    const explicit = process.env.SUPABASE_DATABASE_URL?.trim();
    if (shouldPreferLocalSupabase()) {
        return explicit || LOCAL_SUPABASE_DATABASE_URL;
    }
    return explicit;
}
