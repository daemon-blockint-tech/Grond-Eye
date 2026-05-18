"use client";

import { useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/http/readJsonResponse";

/**
 * Probes whether Earth Engine credentials are configured for satellite imagery.
 *
 * @returns `true` when configured, `false` when not, `null` while loading.
 */
export function useEarthEngineHealth(): boolean | null {
    const [configured, setConfigured] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/earth-engine/health")
            .then(async (r) => {
                if (!r.ok) return { configured: false };
                return readJsonResponse<{ configured?: boolean }>(r);
            })
            .then((data) => {
                if (!cancelled) setConfigured(data.configured === true);
            })
            .catch(() => {
                if (!cancelled) setConfigured(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return configured;
}
