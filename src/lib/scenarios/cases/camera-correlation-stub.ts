import type { ScenarioDefinition } from "../types";

/** Vessel near a known public camera coordinate (display correlation id only). */
export const cameraCorrelationStub: ScenarioDefinition = {
    id: "camera-correlation-stub",
    title: "Camera correlation (stub)",
    description: "Simulated vessel with nearCameraId property for detail panel.",
    tickIntervalMs: 5000,
    entities: [
        {
            id: "sim-vessel-camera",
            label: "Harbor patrol (sim)",
            domain: "surface",
            disposition: "friend",
            latitude: 37.808,
            longitude: -122.409,
            properties: {
                nearCameraId: "public-cam-stub-1",
                correlationNote: "Stub link to public camera feed",
            },
        },
    ],
};
