/**
 * @file healthClient.ts
 * @description Cached client-side probe of `/api/earth-engine/health` for basemap selection.
 */

import { readJsonResponse } from "@/lib/http/readJsonResponse";

let configuredCache: boolean | null = null;
let inflight: Promise<boolean> | null = null;

/**
 * Returns whether Earth Engine credentials are configured on this server.
 * Result is cached for the lifetime of the page session.
 */
export async function fetchEarthEngineConfigured(): Promise<boolean> {
    if (configuredCache !== null) {
        return configuredCache;
    }

    if (!inflight) {
        inflight = fetch("/api/earth-engine/health")
            .then(async (res) => {
                if (!res.ok) return { configured: false };
                return readJsonResponse<{ configured?: boolean }>(res);
            })
            .then((data) => data.configured === true)
            .catch(() => false);
    }

    configuredCache = await inflight;
    inflight = null;
    return configuredCache;
}

/** Clears the cached health result (for tests). */
export function resetEarthEngineHealthCache(): void {
    configuredCache = null;
    inflight = null;
}
