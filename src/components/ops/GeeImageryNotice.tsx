"use client";

import { useState, useSyncExternalStore } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useEarthEngineHealth } from "@/core/hooks/useEarthEngineHealth";
import { useStore } from "@/core/state/store";
import { isGeeImageryLayerId } from "@/core/globe/ImageryProviderFactory";
import { hasGoogleMapsApiKey } from "@/core/globe/googlePhotorealistic3d";

/** True only after client hydration — keeps SSR/first client paint aligned (no chip). */
function useHydrated(): boolean {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}

/**
 * Map imagery availability chip (top-right). Surfaces Google 3D key/load issues
 * and Earth Engine configuration gaps without conflating the two.
 */
export function GeeImageryNotice() {
    const hydrated = useHydrated();
    const baseLayerId = useStore((s) => s.mapConfig.baseLayerId);
    const fallbackLayerId = useStore((s) => s.mapConfig.fallbackLayerId);
    const geeConfigured = useEarthEngineHealth();
    const [dismissed, setDismissed] = useState(false);
    const toggleLeftTab = useStore((s) => s.toggleLeftTab);

    const wantsGoogle3d = baseLayerId === "google-3d";
    const googleUsingFallback = wantsGoogle3d && fallbackLayerId !== null;
    const googleMissingKey = wantsGoogle3d && !hasGoogleMapsApiKey();
    const geeLayerActive = isGeeImageryLayerId(baseLayerId) && fallbackLayerId === null;
    const geeUnavailable = geeLayerActive && geeConfigured === false;

    let message: string | null = null;

    if (googleMissingKey) {
        message = "Google Maps 3D needs an API key";
    } else if (googleUsingFallback) {
        message = "Google Maps 3D unavailable — showing fallback";
    } else if (geeUnavailable) {
        message = "Earth Engine imagery unavailable";
    }

    if (!hydrated || !message || dismissed) {
        return null;
    }

    return (
      <div className="ops-gee-chip glass-panel" role="status" data-testid="imagery-availability-banner">
        <AlertTriangle size={14} className="ops-gee-chip__icon" aria-hidden />
        <span className="ops-gee-chip__text">{message}</span>
        <button
          type="button"
          className="btn ops-gee-chip__action"
          onClick={() => toggleLeftTab("layers")}
        >
          Imagery
        </button>
        <button
          type="button"
          className="ops-gee-chip__dismiss"
          aria-label="Dismiss imagery notice"
          onClick={() => setDismissed(true)}
        >
          <X size={14} />
        </button>
      </div>
    );
}
