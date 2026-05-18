import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpsUserId } from "@/lib/ops/session";
import { agentBus } from "@/lib/agent/bus";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/ops/alerts/[id] — dismiss an alert.
 */
export async function PATCH(_request: Request, context: RouteContext) {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const existing = await prisma.opsAlert.findFirst({ where: { id, userId } });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const alert = await prisma.opsAlert.update({
            where: { id },
            data: { dismissedAt: new Date() },
        });

        agentBus.publish(userId, {
            action: "alert_dismissed",
            alertId: alert.id,
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("PATCH /api/ops/alerts/[id]", e);
        return NextResponse.json({ error: "Failed to dismiss alert" }, { status: 500 });
    }
}
