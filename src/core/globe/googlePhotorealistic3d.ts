/**
 * @file googlePhotorealistic3d.ts
 * @description Shared helpers for Google Photorealistic 3D Tiles — API key resolution,
 * tileset discovery, and lazy loading on the Cesium viewer.
 */

import type { Viewer as CesiumViewer } from "cesium";
import {
    Cesium3DTileset,
    createGooglePhotorealistic3DTileset,
    GoogleMaps,
} from "cesium";
import { getUserApiKey } from "@/lib/userApiKeys";
import { fetchEarthEngineConfigured } from "@/lib/earth-engine/healthClient";

/** Minimum length for a Google Maps API key to be considered configured. */
const MIN_KEY_LENGTH = 20;

/** Tag applied to the Google Photorealistic tileset primitive for discovery. */
export const MAVEN_GOOGLE_3D_TAG = "_grondGooglePhotorealistic";

const loadPromises = new WeakMap<CesiumViewer, Promise<Cesium3DTileset | null>>();

/**
 * Resolves the active Google Maps API key (user localStorage overrides env).
 */
export function resolveGoogleMapsApiKey(): string | null {
    const userKey = getUserApiKey("google_maps");
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    const active = userKey.length >= MIN_KEY_LENGTH ? userKey : envKey;
    return active.length >= MIN_KEY_LENGTH ? active : null;
}

/**
 * Returns true when a Google Maps API key is available in env or user settings.
 */
export function hasGoogleMapsApiKey(): boolean {
    return resolveGoogleMapsApiKey() !== null;
}

/**
 * Finds the Google Photorealistic 3D tileset already attached to the viewer, if any.
 */
export function findGooglePhotorealisticTileset(viewer: CesiumViewer): Cesium3DTileset | null {
    const { primitives } = viewer.scene;
    for (let i = 0; i < primitives.length; i++) {
        const primitive = primitives.get(i);
        if (
            primitive instanceof Cesium3DTileset
            && (primitive as Cesium3DTileset & { [MAVEN_GOOGLE_3D_TAG]?: boolean })[MAVEN_GOOGLE_3D_TAG]
        ) {
            return primitive;
        }
    }
    return null;
}

/**
 * Creates and attaches a Google Photorealistic 3D tileset to the viewer.
 *
 * @param viewer - Active Cesium viewer.
 * @param maxScreenSpaceError - SSE passed to the tileset.
 * @returns The tileset, or null when the key is missing or Cesium rejects the load.
 */
export async function loadGooglePhotorealistic3DTileset(
    viewer: CesiumViewer,
    maxScreenSpaceError: number,
): Promise<Cesium3DTileset | null> {
    if (viewer.isDestroyed()) {
        return null;
    }

    const existing = findGooglePhotorealisticTileset(viewer);
    if (existing) {
        return existing;
    }

    const apiKey = resolveGoogleMapsApiKey();
    if (!apiKey) {
        return null;
    }

    GoogleMaps.defaultApiKey = apiKey;

    try {
        const tileset = await createGooglePhotorealistic3DTileset({
            onlyUsingWithGoogleGeocoder: true,
            ...({ enableCollision: true } as Record<string, unknown>),
        });

        if (viewer.isDestroyed()) {
            tileset.destroy();
            return null;
        }

        tileset.maximumScreenSpaceError = maxScreenSpaceError;
        (tileset as Cesium3DTileset & { maximumMemoryUsage?: number }).maximumMemoryUsage = 2048;
        (tileset as Cesium3DTileset & { [MAVEN_GOOGLE_3D_TAG]?: boolean })[MAVEN_GOOGLE_3D_TAG] = true;

        viewer.scene.primitives.add(tileset);
        return tileset;
    } catch (err) {
        console.error("[googlePhotorealistic3d] Failed to load Google 3D Tiles:", err);
        return null;
    }
}

/**
 * Ensures a Google Photorealistic tileset exists on the viewer (dedupes concurrent loads).
 */
export async function ensureGooglePhotorealistic3DTileset(
    viewer: CesiumViewer,
    maxScreenSpaceError: number,
): Promise<Cesium3DTileset | null> {
    const existing = findGooglePhotorealisticTileset(viewer);
    if (existing) {
        return existing;
    }

    let pending = loadPromises.get(viewer);
    if (!pending) {
        pending = loadGooglePhotorealistic3DTileset(viewer, maxScreenSpaceError).finally(() => {
            loadPromises.delete(viewer);
        });
        loadPromises.set(viewer, pending);
    }

    return pending;
}

/**
 * Picks a raster fallback when Google 3D cannot be used.
 */
export async function resolveGoogle3dRasterFallback(): Promise<"gee-sentinel-rgb" | "osm"> {
    try {
        const geeOk = await fetchEarthEngineConfigured();
        return geeOk ? "gee-sentinel-rgb" : "osm";
    } catch {
        return "osm";
    }
}
