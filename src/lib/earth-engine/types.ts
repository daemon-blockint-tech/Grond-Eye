/**
 * @file types.ts
 * @description Shared types for Earth Engine map sessions served to Cesium.
 */

/** Response shape from `ee.Image.getMapId` (v1 REST tile API). */
export interface EeRawMapId {
    mapid?: string;
    mapId?: string;
    token?: string;
    urlFormat?: string;
    formatTileUrl?: (x: string, y: string, z: string) => string;
}

/** Normalized map session returned by the API and cached server-side. */
export interface EarthEngineMapSession {
    preset: string;
    mapId: string;
    token: string;
    tileUrlTemplate: string;
    expiresAt: number;
}
