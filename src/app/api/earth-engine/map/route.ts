/**
 * @file route.ts
 * @description Server proxy for Earth Engine map tile sessions (service account only).
 */

import { NextRequest, NextResponse } from "next/server";

import { isEarthEngineConfigured } from "@/lib/earth-engine/client";
import { getMapSession, normalizePresetId } from "@/lib/earth-engine/mapSession";
import { isEarthEnginePresetId } from "@/lib/earth-engine/presets";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

const requestCounts = new Map<string, { count: number; windowStart: number }>();

/**
 * Lightweight per-IP rate limit for map session creation.
 */
function checkRateLimit(clientKey: string): boolean {
    const now = Date.now();
    const entry = requestCounts.get(clientKey);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        requestCounts.set(clientKey, { count: 1, windowStart: now });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count += 1;
    return true;
}

/**
 * GET /api/earth-engine/map?preset=gee-sentinel-rgb
 * Returns a short-lived tile URL template for Cesium `UrlTemplateImageryProvider`.
 */
export async function GET(request: NextRequest) {
    const presetParam = request.nextUrl.searchParams.get("preset");
    if (!presetParam) {
        return NextResponse.json({ error: "Missing preset query parameter" }, { status: 400 });
    }

    const preset = normalizePresetId(presetParam);
    if (!isEarthEnginePresetId(preset)) {
        return NextResponse.json(
            { error: `Unknown preset: ${presetParam}` },
            { status: 400 },
        );
    }

    if (!isEarthEngineConfigured()) {
        return NextResponse.json(
            { error: "Earth Engine is not configured on this server" },
            { status: 503 },
        );
    }

    const clientKey =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "anonymous";

    if (!checkRateLimit(clientKey)) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
        const session = await getMapSession(preset);
        return NextResponse.json({
            preset: session.preset,
            mapId: session.mapId,
            token: session.token,
            tileUrlTemplate: session.tileUrlTemplate,
            expiresAt: session.expiresAt,
        });
    } catch (err) {
        console.error("[earth-engine/map] Session creation failed:", err);
        return NextResponse.json(
            { error: "Failed to create Earth Engine map session" },
            { status: 500 },
        );
    }
}
