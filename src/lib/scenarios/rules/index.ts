import type { RuleEvaluationContext, RuleSideEffect, ScenarioRule } from "../types";
import { evaluateGeofenceRules } from "./geofence";
import { evaluateProximityRules } from "./proximity";

/**
 * Run all scenario rules and collect side effects.
 */
export function evaluateRules(
    rules: ScenarioRule[] | undefined,
    ctx: RuleEvaluationContext,
): RuleSideEffect[] {
    if (!rules?.length) return [];
    return [
        ...evaluateProximityRules(rules, ctx),
        ...evaluateGeofenceRules(rules, ctx),
    ];
}
