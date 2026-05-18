import { describe, expect, it } from "vitest";
import type { GeoEntity } from "@/core/plugins/PluginTypes";
import { evaluateGeofenceRules } from "../rules/geofence";
import type { ScenarioRule } from "../types";

function entity(id: string, lat: number, lon: number): GeoEntity {
    return {
        id,
        pluginId: "sim-scenarios",
        latitude: lat,
        longitude: lon,
        timestamp: new Date(),
        label: id,
        properties: { simulated: true },
    };
}

describe("evaluateGeofenceRules", () => {
    it("fires when entity enters polygon", () => {
        const rules: ScenarioRule[] = [
            {
                id: "g1",
                type: "geofence",
                once: true,
                geofence: {
                    entityId: "t1",
                    polygon: [
                        [-122.43, 37.80],
                        [-122.41, 37.80],
                        [-122.41, 37.82],
                        [-122.43, 37.82],
                    ],
                    alertTitle: "Breach",
                },
            },
        ];
        const fired = new Set<string>();
        const effects = evaluateGeofenceRules(rules, {
            entities: [entity("t1", 37.81, -122.42)],
            tick: 1,
            firedRuleIds: fired,
        });
        expect(effects).toHaveLength(1);
        expect(effects[0].type).toBe("alert");
    });
});
