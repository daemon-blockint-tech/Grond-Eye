import type { RuleEvaluationContext, RuleSideEffect, ScenarioRule } from "../types";
import { pointInPolygon } from "./geo";

/**
 * Evaluate geofence rules; fires when entity enters polygon.
 */
export function evaluateGeofenceRules(
    rules: ScenarioRule[],
    ctx: RuleEvaluationContext,
): RuleSideEffect[] {
    const effects: RuleSideEffect[] = [];
    for (const rule of rules) {
        if (rule.type !== "geofence" || !rule.geofence) continue;
        if (rule.once && ctx.firedRuleIds.has(rule.id)) continue;

        const g = rule.geofence;
        const entity = ctx.entities.find((e) => e.id === g.entityId);
        if (!entity) continue;

        if (!pointInPolygon(entity.latitude, entity.longitude, g.polygon)) continue;

        ctx.firedRuleIds.add(rule.id);
        effects.push({
            type: "alert",
            severity: g.alertSeverity ?? "critical",
            title: g.alertTitle ?? `Geofence breach: ${entity.label ?? entity.id}`,
            body: `Entity entered restricted area`,
            entityId: entity.id,
        });
    }
    return effects;
}
