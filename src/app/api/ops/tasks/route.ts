import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpsUserId } from "@/lib/ops/session";
import { agentBus } from "@/lib/agent/bus";

/**
 * GET /api/ops/tasks — list tasks for the current user.
 * POST /api/ops/tasks — create a new task.
 */
export async function GET() {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tasks = await prisma.opsTask.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json({ tasks });
    } catch (e) {
        console.error("GET /api/ops/tasks", e);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const task = await prisma.opsTask.create({
            data: {
                userId,
                title,
                status: "active",
                entityPluginId: body.entityPluginId ?? null,
                entityId: body.entityId ?? null,
                lat: typeof body.lat === "number" ? body.lat : null,
                lon: typeof body.lon === "number" ? body.lon : null,
            },
        });

        agentBus.publish(userId, {
            action: "task_created",
            task: {
                id: task.id,
                title: task.title,
                status: task.status as "active",
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
        console.error("POST /api/ops/tasks", e);
        return NextResponse.json({ error: "Could not save task." }, { status: 500 });
    }
}
