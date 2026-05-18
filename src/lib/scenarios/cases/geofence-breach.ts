import type { ScenarioDefinition } from "../types";

/** Track crosses a restricted polygon → HIGH alert. */
export const geofenceBreach: ScenarioDefinition = {
    id: "geofence-breach",
    title: "Geofence breach",
    description: "Single track enters a restricted area.",
    tickIntervalMs: 2000,
    entities: [
        {
            id: "sim-intruder-track",
            label: "Restricted zone intruder",
            domain: "surface",
            disposition: "hostile",
            latitude: 37.79,
            longitude: -122.44,
            heading: 90,
        },
    ],
    motions: [
        { entityId: "sim-intruder-track", latDelta: 0.003, lonDelta: 0.001 },
    ],
    rules: [
        {
            id: "zone-breach",
            type: "geofence",
            once: true,
            geofence: {
                entityId: "sim-intruder-track",
                polygon: [
                    [-122.43, 37.80],
                    [-122.41, 37.80],
                    [-122.41, 37.82],
                    [-122.43, 37.82],
                ],
                alertSeverity: "critical",
                alertTitle: "Geofence breach — restricted waters",
            },
        },
    ],
};
