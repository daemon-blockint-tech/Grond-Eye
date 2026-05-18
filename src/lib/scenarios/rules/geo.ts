/**
 * Haversine distance in nautical miles between two WGS84 points.
 */
export function distanceNm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R_NM = 3440.065;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Ray-casting point-in-polygon (lon, lat) pairs.
 */
export function pointInPolygon(
    lat: number,
    lon: number,
    polygon: Array<[number, number]>,
): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [lonI, latI] = polygon[i];
        const [lonJ, latJ] = polygon[j];
        const intersect =
            latI > lat !== latJ > lat
            && lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI;
        if (intersect) inside = !inside;
    }
    return inside;
}
