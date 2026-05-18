import {
    Ion,
    IonImageryProvider,
    ArcGisMapServerImageryProvider,
    UrlTemplateImageryProvider,
} from "cesium";

import { fetchEarthEngineConfigured } from "@/lib/earth-engine/healthClient";
import {
    EARTH_ENGINE_PRESET_DEFINITIONS,
    isEarthEnginePresetId,
} from "@/lib/earth-engine/presets";

export interface ImageryLayerEntry {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    type: "google-3d" | "imagery";
}

/** Legacy Bing layer ids migrated to GEE / OSM. */
const LEGACY_IMAGERY_LAYER_MAP: Record<string, string> = {
    "bing-aerial": "gee-sentinel-rgb",
    "bing-labels": "osm",
    "bing-road": "osm",
};

/**
 * Maps persisted Bing layer ids to current basemap presets.
 */
export function migrateImageryLayerId(layerId: string): string {
    return LEGACY_IMAGERY_LAYER_MAP[layerId] ?? layerId;
}

/**
 * True when the resolved layer id requires a server-side Earth Engine map session.
 */
export function isGeeImageryLayerId(layerId: string): boolean {
    const resolved = migrateImageryLayerId(layerId);
    return isEarthEnginePresetId(resolved);
}

export const IMAGERY_LAYERS: ImageryLayerEntry[] = [
    {
        id: "google-3d",
        name: "Google Maps 3D",
        description: "Photorealistic 3D Tiles",
        type: "google-3d",
    },
    ...EARTH_ENGINE_PRESET_DEFINITIONS.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        type: "imagery" as const,
    })),
    {
        id: "osm",
        name: "OpenStreetMap",
        description: "Streets & labels",
        type: "imagery",
    },
    {
        id: "arcgis-world",
        name: "ArcGIS World Imagery",
        description: "Esri satellite tiles",
        type: "imagery",
    },
    {
        id: "blue-marble",
        name: "Blue Marble",
        description: "NASA Earth imagery",
        type: "imagery",
    },
];

export function createOsmProvider() {
    return new UrlTemplateImageryProvider({
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c"],
    });
}

/**
 * True when a Cesium Ion access token is available for IonImageryProvider.
 */
export function hasCesiumIonAccess(): boolean {
    const envToken =
        typeof process !== "undefined"
            ? process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN
            : undefined;
    if (envToken && envToken.length > 0) {
        return true;
    }
    return Boolean(Ion.defaultAccessToken);
}

/**
 * NASA GIBS Blue Marble tiles (EPSG:3857) — does not require a Cesium Ion token.
 */
export function createBlueMarbleGibsProvider() {
    return new UrlTemplateImageryProvider({
        url: "https://gibs-a.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?layer=BlueMarble_NextGeneration&style=default&tilematrixset=GoogleMapsCompatible_Level8&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}",
        maximumLevel: 8,
        credit: "NASA GIBS Blue Marble",
    });
}

/**
 * Blue Marble via Ion when configured; otherwise NASA GIBS WMTS.
 */
export async function createBlueMarbleProvider() {
    if (hasCesiumIonAccess()) {
        try {
            return await IonImageryProvider.fromAssetId(3845);
        } catch (err) {
            console.warn(
                "[ImageryProviderFactory] Ion Blue Marble failed; using NASA GIBS:",
                err,
            );
        }
    } else {
        console.warn(
            "[ImageryProviderFactory] Cesium Ion token not configured; using NASA GIBS Blue Marble",
        );
    }
    return createBlueMarbleGibsProvider();
}

interface EarthEngineMapApiResponse {
    tileUrlTemplate: string;
}

/**
 * Fetches a short-lived Earth Engine tile template from the server proxy.
 */
export async function createGeeImageryProvider(presetId: string) {
    const res = await fetch(
        `/api/earth-engine/map?preset=${encodeURIComponent(presetId)}`,
    );

    if (!res.ok) {
        throw new Error(
            `Earth Engine map session failed (${res.status}): ${await res.text()}`,
        );
    }

    const data = (await res.json()) as EarthEngineMapApiResponse;
    if (!data.tileUrlTemplate) {
        throw new Error("Earth Engine map session missing tileUrlTemplate");
    }

    return new UrlTemplateImageryProvider({
        url: data.tileUrlTemplate,
    });
}

export async function createImageryProvider(layerId: string) {
    const resolvedId = migrateImageryLayerId(layerId);

    if (isEarthEnginePresetId(resolvedId)) {
        if (!(await fetchEarthEngineConfigured())) {
            console.warn(
                `[ImageryProviderFactory] Earth Engine not configured; using OSM instead of ${resolvedId}`,
            );
            return createOsmProvider();
        }
        return createGeeImageryProvider(resolvedId);
    }

    switch (resolvedId) {
        case "osm":
            return createOsmProvider();

        case "arcgis-world":
            return await ArcGisMapServerImageryProvider.fromUrl(
                "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
            );

        case "blue-marble":
            return createBlueMarbleProvider();

        default:
            return createOsmProvider();
    }
}
