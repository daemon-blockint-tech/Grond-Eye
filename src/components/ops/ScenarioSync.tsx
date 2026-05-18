"use client";

import { useEffect, useRef } from "react";
import { dataBus } from "@/core/data/DataBus";
import { pluginManager } from "@/core/plugins/PluginManager";
import { SIM_SCENARIOS_PLUGIN_ID } from "@/lib/scenarios/constants";
import { setSimScenarioEntities } from "@/plugins/sim-scenarios/SimScenariosPlugin";

const POLL_MS = 1500;

/**
 * Polls scenario state from the server and pushes entities into the sim-scenarios plugin layer.
 */
export function ScenarioSync() {
    const lastJson = useRef<string>("");

    useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            try {
                const res = await fetch("/api/ops/scenarios/state", { cache: "no-store" });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entities = Array.isArray(data.entities) ? data.entities : [];
                const payload = JSON.stringify(entities);
                if (payload === lastJson.current) return;
                lastJson.current = payload;

                const normalized = entities.map((e: Record<string, unknown>) => ({
                    ...e,
                    timestamp: e.timestamp ? new Date(e.timestamp as string) : new Date(),
                }));

                setSimScenarioEntities(normalized);
                dataBus.emit("dataUpdated", {
                    pluginId: SIM_SCENARIOS_PLUGIN_ID,
                    entities: normalized,
                });

                if (data.active) {
                    const managed = pluginManager.getPlugin(SIM_SCENARIOS_PLUGIN_ID);
                    if (managed && !managed.enabled) {
                        await pluginManager.enablePlugin(SIM_SCENARIOS_PLUGIN_ID);
                    }
                }
            } catch {
                /* ignore transient poll errors */
            }
        };

        const id = setInterval(() => void poll(), POLL_MS);
        void poll();

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    return null;
}
