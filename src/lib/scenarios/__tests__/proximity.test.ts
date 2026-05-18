import { describe, expect, it } from "vitest";
import type { GeoEntity } from "@/core/plugins/PluginTypes";
import { evaluateProximityRules } from "../rules/proximity";
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

describe("evaluateProximityRules", () => {
    it("fires alert when entities are within threshold", () => {
        const rules: ScenarioRule[] = [
            {
                id: "p1",
                type: "proximity",
                once: true,
                proximity: {
                    entityA: "a",
                    entityB: "b",
                    thresholdNm: 5,
                    alertTitle: "Close",
                },
            },
        ];
        const fired = new Set<string>();
        const effects = evaluateProximityRules(rules, {
            entities: [entity("a", 37.8, -122.4), entity("b", 37.801, -122.401)],
            tick: 1,
            firedRuleIds: fired,
        });
        expect(effects.some((e) => e.type === "alert")).toBe(true);
        expect(fired.has("p1")).toBe(true);
    });

    it("does not refire when once is true", () => {
        const rules: ScenarioRule[] = [
            {
                id: "p1",
                type: "proximity",
                once: true,
                proximity: {
                    entityA: "a",
                    entityB: "b",
                    thresholdNm: 5,
                },
            },
        ];
        const fired = new Set<string>(["p1"]);
        const effects = evaluateProximityRules(rules, {
            entities: [entity("a", 37.8, -122.4), entity("b", 37.801, -122.401)],
            tick: 2,
            firedRuleIds: fired,
        });
        expect(effects).toHaveLength(0);
    });
});
