/**
 * @file client.ts
 * @description One-time Earth Engine initialization via GCP service account (server-only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import ee from "@google/earthengine";

export type EarthEngineModule = typeof ee;

interface ServiceAccountCredentials {
    client_email: string;
    private_key: string;
    project_id?: string;
}

let initPromise: Promise<EarthEngineModule> | null = null;

/**
 * Returns true when Earth Engine credentials are present in the environment.
 */
export function isEarthEngineConfigured(): boolean {
    return loadServiceAccountCredentials() !== null;
}

/**
 * Loads GCP service account JSON from inline env or credentials file path.
 */
function loadServiceAccountCredentials(): ServiceAccountCredentials | null {
    const inline = process.env.EARTHENGINE_SERVICE_ACCOUNT_JSON?.trim();
    if (inline) {
        try {
            const parsed = JSON.parse(inline) as ServiceAccountCredentials;
            if (parsed.client_email && parsed.private_key) {
                return parsed;
            }
        } catch {
            console.warn("[earth-engine] EARTHENGINE_SERVICE_ACCOUNT_JSON is not valid JSON");
        }
    }

    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    if (credPath) {
        try {
            const absolute = resolve(credPath);
            const parsed = JSON.parse(readFileSync(absolute, "utf8")) as ServiceAccountCredentials;
            if (parsed.client_email && parsed.private_key) {
                return parsed;
            }
        } catch (err) {
            console.warn("[earth-engine] Failed to read GOOGLE_APPLICATION_CREDENTIALS:", err);
        }
    }

    return null;
}

/**
 * Resolves the GCP project id for `ee.initialize`.
 */
function resolveProjectId(credentials: ServiceAccountCredentials): string | undefined {
    return (
        process.env.EARTHENGINE_PROJECT?.trim() ||
        credentials.project_id ||
        undefined
    );
}

/**
 * Authenticates and initializes the Earth Engine Node client (idempotent).
 */
export function ensureEarthEngineInitialized(): Promise<EarthEngineModule> {
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        const credentials = loadServiceAccountCredentials();
        if (!credentials) {
            throw new Error(
                "Earth Engine is not configured. Set EARTHENGINE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.",
            );
        }

        const projectId = resolveProjectId(credentials);

        await new Promise<void>((resolve, reject) => {
            ee.data.authenticateViaPrivateKey(
                credentials,
                () => {
                    ee.initialize(
                        null,
                        null,
                        () => resolve(),
                        (err: Error) => reject(err),
                        null,
                        projectId,
                    );
                },
                (err: Error) => reject(err),
            );
        });

        return ee;
    })();

    return initPromise;
}
