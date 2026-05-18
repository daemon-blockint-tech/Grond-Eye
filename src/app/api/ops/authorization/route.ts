import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pluginManager } from "@/core/plugins/PluginManager";
import { getOpsUserId } from "@/lib/ops/session";

/**
 * GET /api/ops/authorization — read-only capability snapshot for the current user.
 */
export async function GET() {
    const userId = await getOpsUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role ?? "user";

    const plugins = pluginManager.getAllPlugins().map((managed) => ({
        pluginId: managed.plugin.id,
        name: managed.plugin.name,
        enabled: managed.enabled,
        capabilities: Array.isArray(
            (managed.plugin as unknown as { capabilities?: string[] }).capabilities,
        )
            ? (managed.plugin as unknown as { capabilities: string[] }).capabilities
            : [],
    }));

    return NextResponse.json({ role, plugins });
}
