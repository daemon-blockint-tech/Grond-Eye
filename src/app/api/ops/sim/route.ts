import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpsUserId } from "@/lib/ops/session";
import { agentBus } from "@/lib/agent/bus";

const simSettingKey = (userId: string) => `ops:simOnly:${userId}`;

/**
 * GET /api/ops/sim — read sim-only filter preference.
 * PATCH /api/ops/sim — update sim-only filter preference.
 */
export async function GET() {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const row = await prisma.setting.findFirst({
            where: { key: simSettingKey(userId) },
        });
        return NextResponse.json({ enabled: row?.value === "true" });
    } catch (e) {
        console.error("GET /api/ops/sim", e);
        return NextResponse.json({ enabled: false });
    }
}

export async function PATCH(request: Request) {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const enabled = body.enabled === true;
        const key = simSettingKey(userId);
        const existing = await prisma.setting.findFirst({ where: { key } });
        if (existing) {
            await prisma.setting.update({
                where: { id: existing.id },
                data: { value: enabled ? "true" : "false" },
            });
        } else {
            await prisma.setting.create({
                data: { key, value: enabled ? "true" : "false" },
            });
        }

        agentBus.publish(userId, { action: "sim_filter", enabled });

        return NextResponse.json({ enabled });
    } catch (e) {
        console.error("PATCH /api/ops/sim", e);
        return NextResponse.json({ error: "Failed to update sim filter" }, { status: 500 });
    }
}
