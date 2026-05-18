/**
 * Built-in plugin that displays entities from the active scenario runner.
 * Data is pushed via ScenarioSync (poll) → dataBus, not via fetch polling.
 */

import { Radio } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";
import { SIM_SCENARIOS_PLUGIN_ID } from "@/lib/scenarios/constants";

let cachedEntities: GeoEntity[] = [];

/**
 * Update entities from ScenarioSync poll (client bridge).
 */
export function setSimScenarioEntities(entities: GeoEntity[]): void {
    cachedEntities = entities;
}

export function createSimScenariosPlugin(): WorldPlugin {
    return {
        id: SIM_SCENARIOS_PLUGIN_ID,
        name: "Scenario simulation",
        description: "Simulated tracks from the scenario runner",
        icon: Radio,
        category: "custom",
        version: "1.0.0",

        async initialize(_ctx: PluginContext): Promise<void> {},
        destroy(): void {
            cachedEntities = [];
        },

        async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
            return cachedEntities;
        },

        getPollingInterval(): number {
            return 9999999;
        },

        getLayerConfig(): LayerConfig {
            return {
                color: "#f59e0b",
                clusterEnabled: true,
                clusterDistance: 48,
            };
        },

        renderEntity(entity: GeoEntity): CesiumEntityOptions {
            const disposition = entity.properties?.disposition as string | undefined;
            const color =
                disposition === "hostile"
                    ? "#ef4444"
                    : disposition === "friend"
                      ? "#22c55e"
                      : "#f59e0b";
            return {
                type: "point",
                color,
                size: 10,
                outlineColor: "#ffffff",
                outlineWidth: 1,
                labelText: entity.label,
            };
        },
    };
}
