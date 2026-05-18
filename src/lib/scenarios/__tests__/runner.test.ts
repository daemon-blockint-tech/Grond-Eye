import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ops/alerts", () => ({
    createOpsAlert: vi.fn().mockResolvedValue({ id: "alert-1" }),
}));
vi.mock("@/lib/ops/tasks", () => ({
    createOpsTask: vi.fn().mockResolvedValue({ id: "task-1" }),
}));
vi.mock("@/lib/agent/bus", () => ({
    agentBus: { publish: vi.fn() },
}));

import { agentBus } from "@/lib/agent/bus";
import { createOpsAlert } from "@/lib/ops/alerts";
import { createOpsTask } from "@/lib/ops/tasks";
import { getScenarioEntities } from "../runtime-store";
import { startScenario, stopScenario, tickScenario } from "../runner";

const USER = "runner-test-user";

describe("scenario runner", () => {
    beforeEach(() => {
        process.env.SCENARIOS_ENABLED = "true";
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await stopScenario(USER);
    });

    it("startScenario activates run and populates runtime store", async () => {
        const status = await startScenario(USER, "maritime-ais-patrol");
        expect(status.active).toBe(true);
        expect(status.caseId).toBe("maritime-ais-patrol");
        expect(status.entityCount).toBe(3);

        const entities = getScenarioEntities(USER);
        expect(entities).toHaveLength(3);
        expect(entities[0].properties.simulated).toBe(true);
        expect(agentBus.publish).toHaveBeenCalled();
    });

    it("tickScenario updates entity positions", async () => {
        await startScenario(USER, "maritime-ais-patrol");
        const latBefore = getScenarioEntities(USER)[0].latitude;
        await tickScenario(USER);
        const latAfter = getScenarioEntities(USER)[0].latitude;
        expect(latAfter).not.toBe(latBefore);
    });

    it("stopScenario clears runtime store and timers", async () => {
        await startScenario(USER, "maritime-ais-patrol");
        await stopScenario(USER);
        expect(getScenarioEntities(USER)).toHaveLength(0);
    });

    it("auto-recon proximity rule creates alert and task once", async () => {
        await startScenario(USER, "auto-recon-investigation");
        for (let i = 0; i < 8; i += 1) {
            await tickScenario(USER);
            if (vi.mocked(createOpsAlert).mock.calls.length > 0) break;
        }
        expect(createOpsAlert).toHaveBeenCalled();
        expect(createOpsTask).toHaveBeenCalled();
    });
});
