import type { GeoEntity } from "@/core/plugins/PluginTypes";

/** Serializable entity template in scenario definitions. */
export type ScenarioEntityTemplate = {
    id: string;
    label: string;
    domain: "surface" | "air" | "subsurface" | "land";
    disposition: "friend" | "hostile" | "neutral" | "unknown";
    latitude: number;
    longitude: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    properties?: Record<string, unknown>;
};

/** Motion applied each tick (optional per entity id). */
export type ScenarioMotion = {
    entityId: string;
    /** Degrees per tick */
    headingDelta?: number;
    /** Knots-equivalent displacement per tick in degrees (small) */
    latDelta?: number;
    lonDelta?: number;
};

export type ScenarioRuleType = "proximity" | "geofence";

export type ScenarioRule = {
    id: string;
    type: ScenarioRuleType;
    /** Run once when condition first becomes true */
    once?: boolean;
    proximity?: {
        entityA: string;
        entityB: string;
        thresholdNm: number;
        alertSeverity?: "info" | "warn" | "critical";
        alertTitle?: string;
        createTask?: boolean;
        taskTitle?: string;
        flyTo?: boolean;
    };
    geofence?: {
        entityId: string;
        polygon: Array<[number, number]>;
        alertSeverity?: "info" | "warn" | "critical";
        alertTitle?: string;
    };
};

export type ScenarioDefinition = {
    id: string;
    title: string;
    description?: string;
    tickIntervalMs?: number;
    entities: ScenarioEntityTemplate[];
    motions?: ScenarioMotion[];
    rules?: ScenarioRule[];
};

export type ScenarioRunStatus = {
    active: boolean;
    caseId: string | null;
    tick: number;
    entityCount: number;
    startedAt: string | null;
};

export type RuleEvaluationContext = {
    entities: GeoEntity[];
    tick: number;
    firedRuleIds: Set<string>;
};

export type RuleSideEffect =
    | { type: "alert"; severity: "info" | "warn" | "critical"; title: string; body?: string; entityId?: string }
    | { type: "task"; title: string; entityId?: string; lat?: number; lon?: number }
    | { type: "fly_to"; lat: number; lon: number; distance?: number };
