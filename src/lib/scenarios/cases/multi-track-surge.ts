import type { ScenarioDefinition } from "../types";

/** Burst of many entities for UI stress testing. */
export function buildMultiTrackSurge(count = 55): ScenarioDefinition {
    const entities = Array.from({ length: count }, (_, i) => {
        const row = Math.floor(i / 11);
        const col = i % 11;
        return {
            id: `sim-surge-${i}`,
            label: `Surge ${i + 1}`,
            domain: "surface" as const,
            disposition: "unknown" as const,
            latitude: 37.75 + row * 0.008,
            longitude: -122.55 + col * 0.012,
            heading: (i * 17) % 360,
            properties: { surgeIndex: i },
        };
    });
    const motions = entities.map((e) => ({
        entityId: e.id,
        latDelta: 0.0002 * (entities.indexOf(e) % 3 === 0 ? 1 : -1),
        lonDelta: 0.0003,
    }));
    return {
        id: "multi-track-surge",
        title: "Multi-track surge",
        description: `${count} simulated tracks for stress testing.`,
        tickIntervalMs: 3000,
        entities,
        motions,
    };
}

export const multiTrackSurge = buildMultiTrackSurge();
