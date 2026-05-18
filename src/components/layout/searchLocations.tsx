import { MapPin } from "lucide-react";
import { buildUserKeyHeaders } from "@/lib/userApiKeys";
import { categorizePlace } from "./placeCategories";
import type { SearchResult, SearchSection } from "./searchTypes";

export type PlacesSearchStatus = "ok" | "unconfigured" | "error" | "zero_results";

export interface PlacesSearchOutcome {
    section: SearchSection | null;
    status: PlacesSearchStatus;
}

/**
 * Queries Google Places autocomplete for map search.
 * @param query - User search string.
 */
export async function searchLocations(query: string): Promise<PlacesSearchOutcome> {
    try {
        const res = await fetch(`/api/places/search?input=${encodeURIComponent(query)}`, {
            headers: buildUserKeyHeaders(),
        });
        if (res.status === 503) {
            return { section: null, status: "unconfigured" };
        }
        if (!res.ok) {
            return { section: null, status: "error" };
        }
        const data = await res.json();
        if (!data.predictions?.length) {
            return { section: null, status: "zero_results" };
        }

        const results: SearchResult[] = data.predictions.map(
            (p: { placeId: string; mainText: string; secondaryText: string; types?: string[] }, i: number) => {
                const category = categorizePlace(p.types || []);
                return {
                    id: p.placeId,
                    label: p.mainText,
                    subLabel: p.secondaryText,
                    score: 100 - i,
                    lat: 0,
                    lon: 0,
                    type: category === "region" ? "country" as const : "place" as const,
                    placeCategory: category,
                };
            }
        );

        return {
            section: {
                title: "Places",
                icon: <MapPin size={16} />,
                results: results.slice(0, 5),
                maxScore: results[0].score,
            },
            status: "ok",
        };
    } catch (err) {
        console.error("Error fetching places:", err);
        return { section: null, status: "error" };
    }
}
