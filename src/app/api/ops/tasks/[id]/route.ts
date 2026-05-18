import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpsUserId } from "@/lib/ops/session";
import { agentBus } from "@/lib/agent/bus";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/ops/tasks/[id] — update task status or title.
 */
export async function PATCH(request: Request, context: RouteContext) {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const body = await request.json();
        const status = body.status as string | undefined;
        const title = typeof body.title === "string" ? body.title.trim() : undefined;

        const existing = await prisma.opsTask.findFirst({ where: { id, userId } });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const task = await prisma.opsTask.update({
            where: { id },
            data: {
                ...(status ? { status } : {}),
                ...(title ? { title } : {}),
            },
        });

        agentBus.publish(userId, {
            action: "task_updated",
            task: {
                id: task.id,
                title: task.title,
                status: task.status as "active" | "completed" | "cancelled",
                entityPluginId: task.entityPluginId,
                entityId: task.entityId,
                lat: task.lat,
                lon: task.lon,
                createdAt: task.createdAt.toISOString(),
                updatedAt: task.updatedAt.toISOString(),
            },
        });

        return NextResponse.json({ task });
    } catch (e) {
        console.error("PATCH /api/ops/tasks/[id]", e);
        return NextResponse.json({ error: "Could not save task." }, { status: 500 });
    }
}
