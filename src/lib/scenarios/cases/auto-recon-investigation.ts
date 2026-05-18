import type { ScenarioDefinition } from "../types";

/** Friendly asset with closing hostile track → alert + task. */
export const autoReconInvestigation: ScenarioDefinition = {
    id: "auto-recon-investigation",
    title: "Auto recon investigation",
    description: "Hostile track closes on friendly asset; triggers alert and investigation task.",
    tickIntervalMs: 2000,
    entities: [
        {
            id: "sim-asset-friendly",
            label: "Friendly Patrol Unit",
            domain: "surface",
            disposition: "friend",
            latitude: 37.808,
            longitude: -122.42,
            heading: 0,
            properties: { role: "asset" },
        },
        {
            id: "sim-track-hostile",
            label: "Unknown Surface Contact",
            domain: "surface",
            disposition: "hostile",
            latitude: 37.82,
            longitude: -122.48,
            heading: 135,
            properties: { role: "intruder" },
        },
    ],
    motions: [
        { entityId: "sim-track-hostile", latDelta: -0.0025, lonDelta: 0.0025, headingDelta: 2 },
    ],
    rules: [
        {
            id: "proximity-investigation",
            type: "proximity",
            once: true,
            proximity: {
                entityA: "sim-asset-friendly",
                entityB: "sim-track-hostile",
                thresholdNm: 2.5,
                alertSeverity: "critical",
                alertTitle: "Suspicious approach — investigation required",
                createTask: true,
                taskTitle: "Investigate unknown surface contact",
                flyTo: true,
            },
        },
    ],
};
