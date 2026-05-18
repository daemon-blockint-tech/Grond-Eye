import { readFile } from "node:fs/promises";
import path from "node:path";
import { BUILTIN_SCENARIOS } from "./cases";
import { parseScenarioDefinition } from "./schema";
import type { ScenarioDefinition } from "./types";

const byId = new Map<string, ScenarioDefinition>();

for (const def of BUILTIN_SCENARIOS) {
    byId.set(def.id, def);
}

/**
 * List all registered scenario case ids.
 */
export function listScenarioIds(): string[] {
    return Array.from(byId.keys()).sort();
}

/**
 * List scenario summaries for UI pickers.
 */
export function listScenarios(): Array<{ id: string; title: string; description?: string }> {
    return listScenarioIds().map((id) => {
        const def = byId.get(id)!;
        return { id, title: def.title, description: def.description };
    });
}

/**
 * Resolve a scenario by id (built-in or loaded from disk).
 */
export function getScenario(caseId: string): ScenarioDefinition | undefined {
    return byId.get(caseId);
}

/**
 * Load scenario.json from local-scripts/scenarios/{caseId}/ and register it.
 */
export async function loadScenarioFromDisk(caseId: string): Promise<ScenarioDefinition> {
    const filePath = path.join(
        process.cwd(),
        "local-scripts",
        "scenarios",
        caseId,
        "scenario.json",
    );
    const raw = JSON.parse(await readFile(filePath, "utf8"));
    const def = parseScenarioDefinition(raw);
    byId.set(def.id, def);
    return def;
}

/**
 * Register a scenario definition at runtime (tests / dynamic load).
 */
export function registerScenario(def: ScenarioDefinition): void {
    byId.set(def.id, def);
}
