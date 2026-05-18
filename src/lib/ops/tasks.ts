import { prisma } from "@/lib/db";
import { agentBus } from "@/lib/agent/bus";

export type CreateOpsTaskInput = {
    userId: string;
    title: string;
    entityPluginId?: string;
    entityId?: string;
    lat?: number;
    lon?: number;
};

/**
 * Persists a task and publishes to the user's AgentBus subscribers.
 */
export async function createOpsTask(input: CreateOpsTaskInput) {
    const task = await prisma.opsTask.create({
        data: {
            userId: input.userId,
            title: input.title,
            status: "active",
            entityPluginId: input.entityPluginId ?? null,
            entityId: input.entityId ?? null,
            lat: input.lat ?? null,
            lon: input.lon ?? null,
        },
    });
    agentBus.publish(input.userId, {
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
    return task;
}
