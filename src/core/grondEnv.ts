/**
 * Resolved Grond environment variables with one-release legacy `WWV_*` fallback.
 */

let legacyPublicEnvWarned = false;
let legacyServerEnvWarned = false;

function readPublicEnv(grondKey: string, legacyKey: string): string | undefined {
    const grond = process.env[grondKey]?.trim();
    if (grond) return grond;
    const legacy = process.env[legacyKey]?.trim();
    if (legacy && !legacyPublicEnvWarned) {
        legacyPublicEnvWarned = true;
        console.warn(`[grondEnv] Using legacy env ${legacyKey}; prefer ${grondKey}`);
    }
    return legacy;
}

function readServerEnv(grondKey: string, legacyKey: string): string | undefined {
    const grond = process.env[grondKey]?.trim();
    if (grond) return grond;
    const legacy = process.env[legacyKey]?.trim();
    if (legacy && !legacyServerEnvWarned) {
        legacyServerEnvWarned = true;
        console.warn(`[grondEnv] Using legacy env ${legacyKey}; prefer ${grondKey}`);
    }
    return legacy;
}

/** Public build-time edition: local | cloud | demo */
export function getPublicEdition(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_EDITION", "NEXT_PUBLIC_WWV_EDITION");
}

export function getPluginDataEngineUrl(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_PLUGIN_DATA_ENGINE_URL", "NEXT_PUBLIC_WWV_PLUGIN_DATA_ENGINE_URL");
}

export function getMarketplaceUrl(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_MARKETPLACE_URL", "NEXT_PUBLIC_WWV_MARKETPLACE_URL");
}

export function getMarketingUrl(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_MARKETING_URL", "NEXT_PUBLIC_WWV_MARKETING_URL");
}

export function getHubUrl(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_HUB_URL", "NEXT_PUBLIC_WWV_HUB_URL");
}

export function getPublicAnalyticsFlag(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_ANALYTICS", "NEXT_PUBLIC_WWV_ANALYTICS");
}

export function getAgentBusEnabled(): boolean {
    const v = readPublicEnv("NEXT_PUBLIC_GROND_AGENT_BUS_ENABLED", "NEXT_PUBLIC_WWV_AGENT_BUS_ENABLED");
    return v === "true";
}

export function getBuildId(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_BUILD_ID", "NEXT_PUBLIC_WWV_BUILD_ID");
}

export function getBuildAt(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_GROND_BUILD_AT", "NEXT_PUBLIC_WWV_BUILD_AT");
}

export function getOpsBannerEnabled(): boolean {
    return readPublicEnv("NEXT_PUBLIC_OPS_BANNER_ENABLED", "NEXT_PUBLIC_OPS_BANNER_ENABLED") === "true";
}

export function getOpsBannerUrl(): string | undefined {
    return readPublicEnv("NEXT_PUBLIC_OPS_BANNER_URL", "NEXT_PUBLIC_OPS_BANNER_URL");
}

export function getDemoAdminSecret(): string | undefined {
    return readServerEnv("GROND_DEMO_ADMIN_SECRET", "WWV_DEMO_ADMIN_SECRET");
}

export function getBridgeToken(): string | undefined {
    return readServerEnv("GROND_BRIDGE_TOKEN", "WWV_BRIDGE_TOKEN");
}

export function getProxyAllowLocal(): boolean {
    return readServerEnv("GROND_PROXY_ALLOW_LOCAL", "WWV_PROXY_ALLOW_LOCAL") === "true";
}

export function getSkipDefaultPlugins(): boolean {
    return readServerEnv("GROND_SKIP_DEFAULT_PLUGINS", "WWV_SKIP_DEFAULT_PLUGINS") === "true";
}

export function getTeardownDbOnExit(): boolean {
    const v = readServerEnv("GROND_TEARDOWN_DB_ON_EXIT", "WWV_TEARDOWN_DB_ON_EXIT");
    return v === "true" || v === "1";
}

export const THEME_STORAGE_KEY = "grond-theme";
export const LEGACY_THEME_STORAGE_KEY = "wwv-theme";
export const CACHE_DB_NAME = "grond-cache";
export const LEGACY_CACHE_DB_NAME = "worldwideview-cache";

export const MARKETPLACE_JWT_ISSUER = "grond";
export const MARKETPLACE_JWT_AUDIENCE = "grond-marketplace";
