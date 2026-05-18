import { edition } from "@/core/edition";

/**
 * Whether scenario run surfaces (API, Sim panel, CLI) are allowed in this deployment.
 */
export function isScenariosEnabled(): boolean {
    if (process.env.SCENARIOS_ENABLED === "true") return true;
    if (process.env.NODE_ENV === "development") return true;
    if (edition === "local" || edition === "demo") return true;
    return false;
}

/**
 * Throws when scenarios are disabled for the current edition/environment.
 */
export function assertScenariosEnabled(): void {
    if (!isScenariosEnabled()) {
        throw new Error("Scenario runner is disabled in this environment");
    }
}
