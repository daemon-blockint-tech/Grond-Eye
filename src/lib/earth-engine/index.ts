/**
 * @file index.ts
 * @description Public exports for the Earth Engine server integration.
 */

export { ensureEarthEngineInitialized, isEarthEngineConfigured } from "./client";
export {
    EARTH_ENGINE_PRESET_DEFINITIONS,
    EARTH_ENGINE_PRESET_IDS,
    isEarthEnginePresetId,
    type EarthEnginePresetId,
} from "./presets";
export { getMapSession, normalizePresetId, buildTileUrlTemplate, clearMapSessionCache } from "./mapSession";
export type { EarthEngineMapSession } from "./types";
