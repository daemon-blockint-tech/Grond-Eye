import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOpsUserId } from "@/lib/ops/session";
import { createOpsAlert } from "@/lib/ops/alerts";

/**
 * GET /api/ops/alerts — non-dismissed alerts for the current user.
 * POST /api/ops/alerts — create an alert for the current user.
 */
export async function GET() {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const alerts = await prisma.opsAlert.findMany({
            where: { userId, dismissedAt: null },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return NextResponse.json({ alerts });
    } catch (e) {
        console.error("GET /api/ops/alerts", e);
        return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
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

        const severity =
            body.severity === "info" || body.severity === "warn" || body.severity === "critical"
                ? body.severity
                : "info";

        const alert = await createOpsAlert({
            userId,
            severity,
            title,
            body: typeof body.body === "string" ? body.body : undefined,
            source: typeof body.source === "string" ? body.source : undefined,
            entityPluginId: typeof body.entityPluginId === "string" ? body.entityPluginId : undefined,
            entityId: typeof body.entityId === "string" ? body.entityId : undefined,
        });

        return NextResponse.json({ alert });
    } catch (e) {
        console.error("POST /api/ops/alerts", e);
        return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
    }
}
