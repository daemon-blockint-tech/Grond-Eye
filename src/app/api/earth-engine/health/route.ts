import { NextResponse } from "next/server";
import { isEarthEngineConfigured } from "@/lib/earth-engine/client";

/**
 * GET /api/earth-engine/health — whether Earth Engine credentials are configured.
 */
export async function GET() {
    return NextResponse.json({
        configured: isEarthEngineConfigured(),
    });
}
