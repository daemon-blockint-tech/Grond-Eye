import { Crosshair } from "lucide-react";
import { parseCoordinates } from "@/lib/geo/parseCoordinates";
import type { SearchResult, SearchSection } from "./searchTypes";

/**
 * Builds a coordinate search section when the query is a valid lat/lon pair.
 * @param query - Raw map search input.
 */
export function searchCoordinates(query: string): SearchSection | null {
    const parsed = parseCoordinates(query);
    if (!parsed) return null;

    const label = `${parsed.lat.toFixed(5)}, ${parsed.lon.toFixed(5)}`;
    const result: SearchResult = {
        id: `coord:${parsed.lat},${parsed.lon}`,
        label,
        subLabel: "Go to coordinates",
        score: 200,
        lat: parsed.lat,
        lon: parsed.lon,
        type: "coordinate",
    };

    return {
        title: "Coordinates",
        icon: <Crosshair size={16} />,
        results: [result],
        maxScore: result.score,
    };
}
