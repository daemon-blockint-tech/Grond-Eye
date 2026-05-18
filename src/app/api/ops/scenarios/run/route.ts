import { NextResponse } from "next/server";
import { getOpsUserId } from "@/lib/ops/session";
import { assertScenariosEnabled } from "@/lib/scenarios/guard";
import { startScenario } from "@/lib/scenarios/runner";

/**
 * POST /api/ops/scenarios/run — start a scenario case for the current user.
 */
export async function POST(request: Request) {
    try {
        assertScenariosEnabled();
    } catch {
        return NextResponse.json({ error: "Scenarios disabled" }, { status: 403 });
    }

    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const caseId = typeof (body as { caseId?: unknown }).caseId === "string"
        ? (body as { caseId: string }).caseId.trim()
        : "";
    if (!caseId) {
        return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }

    try {
        const status = await startScenario(userId, caseId);
        return NextResponse.json({ ok: true, status });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to start scenario";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
