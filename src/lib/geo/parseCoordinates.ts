/**
 * @file parseCoordinates.ts
 * @description Parses decimal degree coordinate strings for map search fly-to.
 */

export interface ParsedCoordinates {
    lat: number;
    lon: number;
}

const DECIMAL_PAIR =
    /^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/;

/**
 * Parses decimal degree pairs such as `37.83, -122.42` or `37.83 -122.42`.
 * @param input - Raw search query.
 * @returns Parsed lat/lon or null when not a valid pair.
 */
export function parseCoordinates(input: string): ParsedCoordinates | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const match = trimmed.match(DECIMAL_PAIR);
    if (!match) return null;

    const lat = Number.parseFloat(match[1]);
    const lon = Number.parseFloat(match[2]);
    if (!isValidLatLon(lat, lon)) return null;

    return { lat, lon };
}

/**
 * True when the query starts like a coordinate the user may still be typing.
 * @param input - Raw search query.
 */
export function looksLikeCoordinates(input: string): boolean {
    const trimmed = input.trim();
    if (!trimmed) return false;
    if (!/^-?\d/.test(trimmed)) return false;
    return /^[\d\s,.;\-]+$/.test(trimmed);
}

/**
 * @param lat - Latitude in degrees.
 * @param lon - Longitude in degrees.
 */
function isValidLatLon(lat: number, lon: number): boolean {
    return Number.isFinite(lat)
        && Number.isFinite(lon)
        && lat >= -90
        && lat <= 90
        && lon >= -180
        && lon <= 180;
}
