import { NextResponse } from "next/server";
import { getOpsUserId } from "@/lib/ops/session";
import { isScenariosEnabled } from "@/lib/scenarios/guard";
import { listScenarios } from "@/lib/scenarios/registry";

/**
 * GET /api/ops/scenarios — list available scenario cases.
 */
export async function GET() {
    if (!isScenariosEnabled()) {
        return NextResponse.json({ error: "Scenarios disabled" }, { status: 403 });
    }
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ scenarios: listScenarios() });
}
