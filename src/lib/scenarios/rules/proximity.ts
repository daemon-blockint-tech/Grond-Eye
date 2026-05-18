import type { GeoEntity } from "@/core/plugins/PluginTypes";
import type { RuleEvaluationContext, RuleSideEffect, ScenarioRule } from "../types";
import { distanceNm } from "./geo";

/**
 * Evaluate proximity rules; returns side effects when threshold is met.
 */
export function evaluateProximityRules(
    rules: ScenarioRule[],
    ctx: RuleEvaluationContext,
): RuleSideEffect[] {
    const effects: RuleSideEffect[] = [];
    for (const rule of rules) {
        if (rule.type !== "proximity" || !rule.proximity) continue;
        if (rule.once && ctx.firedRuleIds.has(rule.id)) continue;

        const p = rule.proximity;
        const a = ctx.entities.find((e) => e.id === p.entityA);
        const b = ctx.entities.find((e) => e.id === p.entityB);
        if (!a || !b) continue;

        const dist = distanceNm(a.latitude, a.longitude, b.latitude, b.longitude);
        if (dist > p.thresholdNm) continue;

        ctx.firedRuleIds.add(rule.id);

        effects.push({
            type: "alert",
            severity: p.alertSeverity ?? "warn",
            title: p.alertTitle ?? `Proximity alert: ${a.label} / ${b.label}`,
            body: `Distance ${dist.toFixed(1)} nm (threshold ${p.thresholdNm} nm)`,
            entityId: b.id,
        });

        if (p.createTask) {
            effects.push({
                type: "task",
                title: p.taskTitle ?? `Investigate ${b.label ?? b.id}`,
                entityId: b.id,
                lat: b.latitude,
                lon: b.longitude,
            });
        }

        if (p.flyTo) {
            effects.push({
                type: "fly_to",
                lat: b.latitude,
                lon: b.longitude,
                distance: 80000,
            });
        }
    }
    return effects;
}
