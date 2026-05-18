import { prisma } from "@/lib/db";
import { agentBus } from "@/lib/agent/bus";

export type CreateOpsAlertInput = {
    userId: string;
    severity: "info" | "warn" | "critical";
    title: string;
    body?: string;
    source?: string;
    entityPluginId?: string;
    entityId?: string;
};

/**
 * Persists an alert and publishes to the user's AgentBus subscribers.
 */
export async function createOpsAlert(input: CreateOpsAlertInput) {
    const alert = await prisma.opsAlert.create({
        data: {
            userId: input.userId,
            severity: input.severity,
            title: input.title,
            body: input.body,
            source: input.source,
            entityPluginId: input.entityPluginId,
            entityId: input.entityId,
        },
    });
    agentBus.publish(input.userId, {
        action: "alert_created",
        alert: {
            id: alert.id,
            severity: alert.severity as "info" | "warn" | "critical",
            title: alert.title,
            body: alert.body,
            source: alert.source,
            entityPluginId: alert.entityPluginId,
            entityId: alert.entityId,
            createdAt: alert.createdAt.toISOString(),
        },
    });
    return alert;
}
