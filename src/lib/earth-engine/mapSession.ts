/**
 * @file mapSession.ts
 * @description Cached Earth Engine map sessions (`getMapId`) for Cesium tile templates.
 */

import { ensureEarthEngineInitialized } from "./client";
import { buildPresetImage, isEarthEnginePresetId, type EarthEnginePresetId } from "./presets";
import type { EarthEngineMapSession, EeRawMapId } from "./types";

/** Cache TTL — Earth Engine map IDs typically expire within a few hours. */
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/** Refresh cached sessions this long before expiry. */
const REFRESH_BUFFER_MS = 10 * 60 * 1000;

const sessionCache = new Map<string, EarthEngineMapSession>();

/**
 * Normalizes preset query aliases to canonical ids.
 */
export function normalizePresetId(preset: string): string {
    const trimmed = preset.trim();
    const aliases: Record<string, EarthEnginePresetId> = {
        sentinel: "gee-sentinel-rgb",
        "sentinel-rgb": "gee-sentinel-rgb",
        landsat: "gee-landsat-rgb",
        "landsat-rgb": "gee-landsat-rgb",
        "wri-forest-loss": "gee-wri-forest-loss-drivers",
        "wri-forest-loss-drivers": "gee-wri-forest-loss-drivers",
        "wri-perm-ag": "gee-wri-forest-loss-perm-ag",
        "spot-brazil": "gee-spot-brazil-rgb",
    };
    return aliases[trimmed] ?? trimmed;
}

/**
 * Builds a Cesium-compatible tile URL template from an EE `getMapId` result.
 */
export function buildTileUrlTemplate(raw: EeRawMapId): string {
    if (raw.urlFormat) {
        return raw.urlFormat;
    }

    const mapId = raw.mapid ?? raw.mapId;
    if (!mapId) {
        throw new Error("Earth Engine getMapId response missing map id");
    }

    const tokenQuery = raw.token ? `?token=${raw.token}` : "";
    return `https://earthengine.googleapis.com/v1/${mapId}/tiles/{z}/{x}/{y}${tokenQuery}`;
}

/**
 * Resolves `getMapId` whether the EE client returns a Promise or a plain object.
 */
async function resolveGetMapId(
    image: { getMapId: (vis: Record<string, unknown>) => EeRawMapId | Promise<EeRawMapId> },
    visParams: Record<string, unknown>,
): Promise<EeRawMapId> {
    const result = image.getMapId(visParams);
    if (result && typeof (result as Promise<EeRawMapId>).then === "function") {
        return await result;
    }
    return result as EeRawMapId;
}

/**
 * Returns a cached or freshly created map session for the given preset.
 */
export async function getMapSession(presetParam: string): Promise<EarthEngineMapSession> {
    const preset = normalizePresetId(presetParam);
    if (!isEarthEnginePresetId(preset)) {
        throw new Error(`Unknown Earth Engine preset: ${presetParam}`);
    }

    const cached = sessionCache.get(preset);
    const now = Date.now();
    if (cached && cached.expiresAt - REFRESH_BUFFER_MS > now) {
        return cached;
    }

    const ee = await ensureEarthEngineInitialized();
    const { image, visParams } = buildPresetImage(ee, preset);
    const raw = await resolveGetMapId(image, visParams);

    const mapId = raw.mapid ?? raw.mapId;
    if (!mapId) {
        throw new Error("Earth Engine getMapId response missing map id");
    }

    const session: EarthEngineMapSession = {
        preset,
        mapId,
        token: raw.token ?? "",
        tileUrlTemplate: buildTileUrlTemplate(raw),
        expiresAt: now + SESSION_TTL_MS,
    };

    sessionCache.set(preset, session);
    return session;
}

/** Clears the in-memory session cache (for tests). */
export function clearMapSessionCache(): void {
    sessionCache.clear();
}
