"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import { useStore } from "@/core/state/store";
import { dataBus } from "@/core/data/DataBus";
import { buildUserKeyHeaders } from "@/lib/userApiKeys";
import { trackEvent } from "@/lib/analytics";
import { looksLikeCoordinates } from "@/lib/geo/parseCoordinates";
import { getZoomForTypes } from "./placeCategories";
import { useSearchHistory } from "./useSearchHistory";
import type { SearchResult, SearchSection } from "./searchTypes";
import { searchEntities } from "./searchEntities";
import { searchLocations, type PlacesSearchStatus } from "./searchLocations";
import { searchCoordinates } from "./searchCoordinates";

export type { SearchResult, SearchSection };

export type SearchEmptyReason =
    | null
    | "no_results"
    | "places_unconfigured"
    | "places_error"
    | "try_coordinates";

const COORDINATE_VIEW_DISTANCE_M = 12_000;

/**
 * Map search hook: entities, coordinates, and Google Places.
 */
export function useSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [liveSections, setLiveSections] = useState<SearchSection[]>([]);
    const [emptyReason, setEmptyReason] = useState<SearchEmptyReason>(null);
    const [placesStatus, setPlacesStatus] = useState<PlacesSearchStatus | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const setCameraPosition = useStore((s) => s.setCameraPosition);
    const setSelectedEntity = useStore((s) => s.setSelectedEntity);
    const { history, addToHistory, clearHistory } = useSearchHistory();

    const sections: SearchSection[] = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            if (history.length === 0) return [];
            return [{
                title: "Recent",
                icon: <Clock size={16} />,
                results: history,
                maxScore: 0,
            }];
        }
        const matchingHistory = history.filter(
            (r) => r.label.toLowerCase().includes(q)
                || (r.subLabel && r.subLabel.toLowerCase().includes(q))
        );
        const recentSection: SearchSection | null = matchingHistory.length > 0
            ? {
                title: "Recent",
                icon: <Clock size={16} />,
                results: matchingHistory,
                maxScore: 99,
            }
            : null;
        return recentSection ? [recentSection, ...liveSections] : liveSections;
    }, [query, history, liveSections]);

    const flatResults = sections.flatMap((s) => s.results);

    useEffect(() => {
        if (!query.trim()) {
            setLiveSections((prev) => (prev.length === 0 ? prev : []));
            setEmptyReason(null);
            setPlacesStatus(null);
            setSelectedIndex((prev) => (prev === 0 ? prev : 0));
            return;
        }
        let isStale = false;

        const run = async () => {
            const currentLayers = useStore.getState().layers;
            const newSections = searchEntities(query, currentLayers);

            const coordSection = searchCoordinates(query);
            if (coordSection) newSections.push(coordSection);

            const placesOutcome = await searchLocations(query);
            if (isStale) return;

            setPlacesStatus(placesOutcome.status);
            if (placesOutcome.section) newSections.push(placesOutcome.section);

            newSections.sort((a, b) => b.maxScore - a.maxScore);
            setLiveSections(newSections);

            if (newSections.length === 0) {
                if (placesOutcome.status === "unconfigured") {
                    setEmptyReason("places_unconfigured");
                } else if (placesOutcome.status === "error") {
                    setEmptyReason("places_error");
                } else if (looksLikeCoordinates(query)) {
                    setEmptyReason("try_coordinates");
                    trackEvent("search-places-zero-results", { query, hint: "try_coordinates" });
                } else {
                    setEmptyReason("no_results");
                    trackEvent("search-places-zero-results", { query, hint: "no_results" });
                }
            } else {
                setEmptyReason(null);
            }

            setSelectedIndex(0);
        };

        const timer = setTimeout(run, 300);
        return () => { isStale = true; clearTimeout(timer); };
    }, [query]);

    const handleSelect = async (result: SearchResult) => {
        addToHistory(result);
        setIsOpen(false);
        setQuery("");
        trackEvent("search-select", { type: result.type, label: result.label });
        trackEvent("search-query", { query: result.label });

        if (result.type === "entity" && result.entity) {
            dataBus.emit("cameraGoTo", {
                lat: result.lat,
                lon: result.lon,
                alt: result.entity.altitude || 0,
            });
            setSelectedEntity(result.entity);
        } else if (result.type === "coordinate") {
            setSelectedEntity(null);
            dataBus.emit("cameraGoTo", {
                lat: result.lat,
                lon: result.lon,
                alt: 0,
                distance: COORDINATE_VIEW_DISTANCE_M,
                maxPitch: -45,
                heading: 0,
            });
            setCameraPosition(result.lat, result.lon, COORDINATE_VIEW_DISTANCE_M);
            trackEvent("search-coord-success", { lat: result.lat, lon: result.lon });
        } else if (result.type === "country" || result.type === "place") {
            setSelectedEntity(null);
            try {
                const res = await fetch(`/api/places/details?place_id=${result.id}`, {
                    headers: buildUserKeyHeaders(),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.lat && data.lon) {
                        const { distance, maxPitch } = getZoomForTypes(data.types, data.viewport);
                        dataBus.emit("cameraGoTo", {
                            lat: data.lat,
                            lon: data.lon,
                            alt: 0,
                            distance,
                            maxPitch,
                            heading: 0,
                        });
                        setCameraPosition(data.lat, data.lon, distance);
                    }
                }
            } catch (err) {
                console.error("Error fetching place details:", err);
            }
        }
    };

    return {
        query,
        setQuery,
        isOpen,
        setIsOpen,
        sections,
        selectedIndex,
        setSelectedIndex,
        flatResults,
        handleSelect,
        clearHistory,
        emptyReason,
        placesStatus,
    };
}
