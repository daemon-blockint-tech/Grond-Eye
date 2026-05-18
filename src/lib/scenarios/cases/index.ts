import { airSimPatrol } from "./air-sim-patrol";
import { autoReconInvestigation } from "./auto-recon-investigation";
import { cameraCorrelationStub } from "./camera-correlation-stub";
import { geofenceBreach } from "./geofence-breach";
import { maritimeAisPatrol } from "./maritime-ais-patrol";
import { multiTrackSurge } from "./multi-track-surge";
import type { ScenarioDefinition } from "../types";

/** Built-in scenario case catalog. */
export const BUILTIN_SCENARIOS: ScenarioDefinition[] = [
    maritimeAisPatrol,
    airSimPatrol,
    autoReconInvestigation,
    geofenceBreach,
    multiTrackSurge,
    cameraCorrelationStub,
];

export {
    maritimeAisPatrol,
    airSimPatrol,
    autoReconInvestigation,
    geofenceBreach,
    multiTrackSurge,
    cameraCorrelationStub,
};
