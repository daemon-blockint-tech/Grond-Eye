import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGetMapSession, mockIsConfigured } = vi.hoisted(() => ({
    mockGetMapSession: vi.fn(),
    mockIsConfigured: vi.fn(),
}));

vi.mock("@/lib/earth-engine/mapSession", () => ({
    getMapSession: mockGetMapSession,
    normalizePresetId: (id: string) => id,
}));

vi.mock("@/lib/earth-engine/client", () => ({
    isEarthEngineConfigured: mockIsConfigured,
}));

vi.mock("@/lib/earth-engine/presets", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/earth-engine/presets")>();
    return {
        isEarthEnginePresetId: actual.isEarthEnginePresetId,
    };
});

import { GET } from "./route";

afterEach(() => {
    vi.clearAllMocks();
});

function makeRequest(preset?: string) {
    const url = preset
        ? `http://localhost/api/earth-engine/map?preset=${preset}`
        : "http://localhost/api/earth-engine/map";
    return new NextRequest(url);
}

describe("GET /api/earth-engine/map", () => {
    it("returns 400 when preset is missing", async () => {
        const res = await GET(makeRequest());
        expect(res.status).toBe(400);
    });

    it("returns 400 for unknown preset", async () => {
        mockIsConfigured.mockReturnValue(true);
        const res = await GET(makeRequest("not-a-preset"));
        expect(res.status).toBe(400);
    });

    it("returns 503 when Earth Engine is not configured", async () => {
        mockIsConfigured.mockReturnValue(false);
        const res = await GET(makeRequest("gee-sentinel-rgb"));
        expect(res.status).toBe(503);
    });

    it("returns map session JSON for valid preset", async () => {
        mockIsConfigured.mockReturnValue(true);
        mockGetMapSession.mockResolvedValue({
            preset: "gee-sentinel-rgb",
            mapId: "projects/x/maps/y",
            token: "tok",
            tileUrlTemplate: "https://earthengine.googleapis.com/v1/x/tiles/{z}/{x}/{y}?token=tok",
            expiresAt: Date.now() + 3600000,
        });

        const res = await GET(makeRequest("gee-sentinel-rgb"));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.preset).toBe("gee-sentinel-rgb");
        expect(body.tileUrlTemplate).toContain("{z}/{x}/{y}");
    });
});
