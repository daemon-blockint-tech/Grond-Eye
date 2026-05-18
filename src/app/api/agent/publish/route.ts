import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { agentBus, type AgentAction } from "@/lib/agent/bus";
import { assertScenariosEnabled } from "@/lib/scenarios/guard";
import { scenarioStatusForUser, startScenario, stopScenario } from "@/lib/scenarios/runner";

/**
 * POST /api/agent/publish
 *
 * Accept an AgentAction from a trusted caller (an external tool acting as
 * the logged-in user) and broadcast it to every subscriber currently
 * listening on /api/agent/stream *for the same user*. The browser subscriber
 * routes the action onto the client-side dataBus, which the React + Cesium
 * app already drives off of.
 *
 * Returns the number of clients the action reached.
 *
 * Auth: same session-cookie gate as /stream — only the same user's
 * sessions can publish or subscribe, and per-user routing is enforced
 * inside the bus.
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!isAgentAction(body)) {
        return NextResponse.json(
            { error: "Body must be an AgentAction with a recognized `action` field" },
            { status: 400 },
        );
    }

    if (body.action === "scenario_start") {
        try {
            assertScenariosEnabled();
            const status = await startScenario(userId, body.caseId);
            return NextResponse.json({
                ok: true,
                status,
                subscribers: agentBus.subscribersFor(userId),
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : "Scenario start failed";
            return NextResponse.json({ error: message }, { status: 400 });
        }
    }

    if (body.action === "scenario_stop") {
        try {
            assertScenariosEnabled();
            await stopScenario(userId);
            return NextResponse.json({
                ok: true,
                subscribers: agentBus.subscribersFor(userId),
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : "Scenario stop failed";
            return NextResponse.json({ error: message }, { status: 400 });
        }
    }

    if (body.action === "scenario_status") {
        return NextResponse.json({
            ok: true,
            status: scenarioStatusForUser(userId),
        });
    }

    const result = agentBus.publish(userId, body);
    return NextResponse.json({
        ok: true,
        delivered: result.delivered,
        subscribers: agentBus.subscribersFor(userId),
    });
}

function isAgentAction(v: unknown): v is AgentAction {
    if (!v || typeof v !== "object") return false;
    const a = (v as { action?: unknown }).action;
    return (
        a === "fly_to"
        || a === "face_towards"
        || a === "layer_toggle"
        || a === "highlight_layer"
        || a === "select_entity"
        || a === "ping"
        || a === "task_created"
        || a === "task_updated"
        || a === "alert_created"
        || a === "alert_dismissed"
        || a === "authorization_changed"
        || a === "sim_filter"
        || a === "scenario_start"
        || a === "scenario_stop"
        || a === "scenario_status"
    );
}
