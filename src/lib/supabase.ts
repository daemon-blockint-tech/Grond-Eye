import { createClient } from "@supabase/supabase-js";

import { resolveSupabaseConfig } from "./supabase-config";

let client: ReturnType<typeof createClient> | null = null;

/**
 * Returns a singleton Supabase client for server-side use.
 * Returns null if environment variables are not configured.
 */
export function getSupabaseClient() {
    if (client) return client;

    const config = resolveSupabaseConfig();
    if (!config?.url || !config.serviceRoleKey) return null;

    client = createClient(config.url, config.serviceRoleKey, {
        auth: { persistSession: false },
    });
    return client;
}
