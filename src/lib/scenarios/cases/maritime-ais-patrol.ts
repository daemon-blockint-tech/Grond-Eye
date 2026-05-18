import type { ScenarioDefinition } from "../types";

/** AIS-style surface vessel patrol (ingest-only). */
export const maritimeAisPatrol: ScenarioDefinition = {
    id: "maritime-ais-patrol",
    title: "Maritime AIS patrol",
    description: "Three surface vessels with slow drift and heading updates.",
    tickIntervalMs: 2000,
    entities: [
        {
            id: "sim-vessel-alpha",
            label: "Patrol Alpha",
            domain: "surface",
            disposition: "neutral",
            latitude: 37.82,
            longitude: -122.45,
            heading: 90,
            speed: 8,
            properties: { mmsi: "366999001", source: "ais-sim" },
        },
        {
            id: "sim-vessel-bravo",
            label: "Patrol Bravo",
            domain: "surface",
            disposition: "friend",
            latitude: 37.79,
            longitude: -122.38,
            heading: 180,
            speed: 6,
            properties: { mmsi: "366999002", source: "ais-sim" },
        },
        {
            id: "sim-vessel-charlie",
            label: "Patrol Charlie",
            domain: "surface",
            disposition: "unknown",
            latitude: 37.85,
            longitude: -122.52,
            heading: 270,
            speed: 10,
            properties: { mmsi: "366999003", source: "ais-sim" },
        },
    ],
    motions: [
        { entityId: "sim-vessel-alpha", latDelta: 0.0008, lonDelta: 0.0012, headingDelta: 5 },
        { entityId: "sim-vessel-bravo", latDelta: -0.0006, lonDelta: 0.0009, headingDelta: -3 },
        { entityId: "sim-vessel-charlie", latDelta: 0.0004, lonDelta: -0.0011, headingDelta: 8 },
    ],
};
