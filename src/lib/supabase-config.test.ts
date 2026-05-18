import { afterEach, describe, expect, it, vi } from "vitest";

import {
    isLocalSupabaseUrl,
    resolveSupabaseConfig,
    shouldPreferLocalSupabase,
    LOCAL_SUPABASE_URL,
} from "./supabase-config";

describe("isLocalSupabaseUrl", () => {
    it("detects loopback hosts", () => {
        expect(isLocalSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
        expect(isLocalSupabaseUrl("http://localhost:54321")).toBe(true);
        expect(isLocalSupabaseUrl("https://abc.supabase.co")).toBe(false);
    });
});

describe("resolveSupabaseConfig", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("prefers local defaults in development when no cloud URL is set", () => {
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("SUPABASE_PREFER_LOCAL", "true");
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const config = resolveSupabaseConfig();
        expect(config?.source).toBe("local");
        expect(config?.url).toBe(LOCAL_SUPABASE_URL);
    });

    it("uses explicit cloud env when local preference is disabled", () => {
        vi.stubEnv("SUPABASE_PREFER_LOCAL", "false");
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
        vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");

        const config = resolveSupabaseConfig();
        expect(config?.source).toBe("env");
        expect(config?.url).toBe("https://example.supabase.co");
    });
});

describe("shouldPreferLocalSupabase", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("honors SUPABASE_PREFER_LOCAL=false", () => {
        vi.stubEnv("SUPABASE_PREFER_LOCAL", "false");
        expect(shouldPreferLocalSupabase()).toBe(false);
    });
});
