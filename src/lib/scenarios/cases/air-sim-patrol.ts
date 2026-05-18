import type { ScenarioDefinition } from "../types";

/** Friendly air tracks on orbit-style paths. */
export const airSimPatrol: ScenarioDefinition = {
    id: "air-sim-patrol",
    title: "Air sim patrol",
    description: "Simulated friendly ISR-style tracks.",
    tickIntervalMs: 2500,
    entities: [
        {
            id: "sim-air-orbit-1",
            label: "Sim MQ-4 Alpha",
            domain: "air",
            disposition: "friend",
            latitude: 37.9,
            longitude: -122.5,
            altitude: 15000,
            heading: 45,
            speed: 120,
            properties: { callsign: "SIM01", platform: "UAS" },
        },
        {
            id: "sim-air-orbit-2",
            label: "Sim MQ-4 Bravo",
            domain: "air",
            disposition: "friend",
            latitude: 37.75,
            longitude: -122.35,
            altitude: 14500,
            heading: 225,
            speed: 115,
            properties: { callsign: "SIM02", platform: "UAS" },
        },
    ],
    motions: [
        { entityId: "sim-air-orbit-1", latDelta: 0.002, lonDelta: 0.002, headingDelta: 10 },
        { entityId: "sim-air-orbit-2", latDelta: -0.0015, lonDelta: 0.0018, headingDelta: -8 },
    ],
};
