import { NextResponse } from "next/server";
import { getOpsUserId } from "@/lib/ops/session";
import { assertScenariosEnabled } from "@/lib/scenarios/guard";
import { stopScenario } from "@/lib/scenarios/runner";
import { SIM_SCENARIOS_PLUGIN_ID } from "@/lib/scenarios/constants";
import { agentBus } from "@/lib/agent/bus";
/**
 * POST /api/ops/scenarios/stop — stop the active scenario for the current user.
 */
export async function POST() {
    try {
        assertScenariosEnabled();
    } catch {
        return NextResponse.json({ error: "Scenarios disabled" }, { status: 403 });
    }

    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await stopScenario(userId);

    agentBus.publish(userId, {
        action: "layer_toggle",
        pluginId: SIM_SCENARIOS_PLUGIN_ID,
        enabled: false,
    });

    return NextResponse.json({ ok: true });
}
