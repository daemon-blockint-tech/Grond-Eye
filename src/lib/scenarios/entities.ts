import type { GeoEntity } from "@/core/plugins/PluginTypes";
import { SIM_SCENARIOS_PLUGIN_ID } from "./constants";
import type { ScenarioDefinition, ScenarioEntityTemplate, ScenarioMotion } from "./types";

/**
 * Build initial GeoEntity array from a scenario definition.
 */
export function entitiesFromDefinition(
    def: ScenarioDefinition,
    caseId: string,
): GeoEntity[] {
    const now = new Date();
    return def.entities.map((t) => templateToEntity(t, caseId, now));
}

/**
 * Apply per-tick motion updates to entities (mutates positions in place).
 */
export function applyMotions(
    entities: GeoEntity[],
    motions: ScenarioMotion[] | undefined,
): GeoEntity[] {
    if (!motions?.length) return entities;
    const byId = new Map(entities.map((e) => [e.id, e]));
    for (const m of motions) {
        const e = byId.get(m.entityId);
        if (!e) continue;
        if (m.latDelta != null) e.latitude += m.latDelta;
        if (m.lonDelta != null) e.longitude += m.lonDelta;
        if (m.headingDelta != null) {
            e.heading = ((e.heading ?? 0) + m.headingDelta + 360) % 360;
        }
        e.timestamp = new Date();
    }
    return entities;
}

/**
 * True when entity properties mark it as scenario-simulated.
 */
export function isSimulatedEntity(entity: GeoEntity): boolean {
    return (
        entity.properties?.simulated === true
        || entity.properties?.isSimulated === true
    );
}

function templateToEntity(
    t: ScenarioEntityTemplate,
    caseId: string,
    timestamp: Date,
): GeoEntity {
    return {
        id: t.id,
        pluginId: SIM_SCENARIOS_PLUGIN_ID,
        latitude: t.latitude,
        longitude: t.longitude,
        altitude: t.altitude,
        heading: t.heading,
        speed: t.speed,
        timestamp,
        label: t.label,
        properties: {
            simulated: true,
            isSimulated: true,
            domain: t.domain,
            disposition: t.disposition,
            scenarioId: caseId,
            caseId,
            ...t.properties,
        },
    };
}
