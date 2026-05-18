import { describe, expect, it } from "vitest";
import { maritimeAisPatrol } from "../cases/maritime-ais-patrol";
import { applyMotions, entitiesFromDefinition } from "../entities";
import { SIM_SCENARIOS_PLUGIN_ID } from "../constants";

describe("entitiesFromDefinition", () => {
    it("marks entities as simulated", () => {
        const entities = entitiesFromDefinition(maritimeAisPatrol, maritimeAisPatrol.id);
        expect(entities).toHaveLength(3);
        expect(entities[0].pluginId).toBe(SIM_SCENARIOS_PLUGIN_ID);
        expect(entities[0].properties.simulated).toBe(true);
        expect(entities[0].properties.caseId).toBe("maritime-ais-patrol");
    });
});

describe("applyMotions", () => {
    it("updates position and heading", () => {
        const entities = entitiesFromDefinition(maritimeAisPatrol, maritimeAisPatrol.id);
        const lat0 = entities[0].latitude;
        const updated = applyMotions(entities, maritimeAisPatrol.motions);
        expect(updated[0].latitude).not.toBe(lat0);
    });
});
