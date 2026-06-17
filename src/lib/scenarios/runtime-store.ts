import type { GeoEntity } from "@/core/plugins/PluginTypes";
import type { ScenarioRunStatus } from "./types";

type UserRuntime = {
    caseId: string;
    tick: number;
    entities: GeoEntity[];
    startedAt: string;
};

const byUser = new Map<string, UserRuntime>();

declare global {
    // eslint-disable-next-line no-var
    var __MAVEN_SCENARIO_RUNTIME__: Map<string, UserRuntime> | undefined;
}

const store: Map<string, UserRuntime> =
    globalThis.__MAVEN_SCENARIO_RUNTIME__ ?? (globalThis.__MAVEN_SCENARIO_RUNTIME__ = byUser);

/**
 * Persist current entities for a user's active scenario.
 */
export function setScenarioEntities(userId: string, caseId: string, entities: GeoEntity[], tick: number): void {
    const existing = store.get(userId);
    store.set(userId, {
        caseId,
        tick,
        entities,
        startedAt: existing?.startedAt ?? new Date().toISOString(),
    });
}

/**
 * Clear scenario state for a user.
 */
export function clearScenario(userId: string): void {
    store.delete(userId);
}

/**
 * Read entities for polling clients.
 */
export function getScenarioEntities(userId: string): GeoEntity[] {
    return store.get(userId)?.entities ?? [];
}

/**
 * Scenario run status for API/UI.
 */
export function getScenarioStatus(userId: string): ScenarioRunStatus {
    const rt = store.get(userId);
    if (!rt) {
        return { active: false, caseId: null, tick: 0, entityCount: 0, startedAt: null };
    }
    return {
        active: true,
        caseId: rt.caseId,
        tick: rt.tick,
        entityCount: rt.entities.length,
        startedAt: rt.startedAt,
    };
}

/**
 * Whether a scenario is running for the user.
 */
export function isScenarioActive(userId: string): boolean {
    return store.has(userId);
}
