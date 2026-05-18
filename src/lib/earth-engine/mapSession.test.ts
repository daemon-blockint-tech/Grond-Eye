import { afterEach, describe, expect, it, vi } from "vitest";

import {
    buildTileUrlTemplate,
    clearMapSessionCache,
    getMapSession,
    normalizePresetId,
} from "./mapSession";

vi.mock("./client", () => ({
    ensureEarthEngineInitialized: vi.fn(),
}));

vi.mock("./presets", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./presets")>();
    return {
        ...actual,
        buildPresetImage: vi.fn(() => ({
            image: {
                getMapId: vi.fn(() => ({
                    mapid: "projects/test/maps/abc123",
                    token: "test-token",
                    urlFormat:
                        "https://earthengine.googleapis.com/v1/projects/test/maps/abc123/tiles/{z}/{x}/{y}?token=test-token",
                })),
            },
            visParams: { bands: ["B4", "B3", "B2"] },
        })),
    };
});

afterEach(() => {
    clearMapSessionCache();
    vi.clearAllMocks();
});

describe("normalizePresetId", () => {
    it("maps short aliases to canonical preset ids", () => {
        expect(normalizePresetId("sentinel")).toBe("gee-sentinel-rgb");
        expect(normalizePresetId("landsat-rgb")).toBe("gee-landsat-rgb");
    });
});

describe("buildTileUrlTemplate", () => {
    it("uses urlFormat when provided", () => {
        const template = buildTileUrlTemplate({
            mapid: "x",
            urlFormat: "https://example.com/{z}/{x}/{y}",
        });
        expect(template).toBe("https://example.com/{z}/{x}/{y}");
    });

    it("builds v1 tile URL when only mapid and token exist", () => {
        const template = buildTileUrlTemplate({
            mapid: "projects/p/maps/m1",
            token: "tok",
        });
        expect(template).toContain("earthengine.googleapis.com");
        expect(template).toContain("{z}/{x}/{y}");
        expect(template).toContain("token=tok");
    });
});

describe("getMapSession", () => {
    it("returns cached session within TTL", async () => {
        const first = await getMapSession("gee-sentinel-rgb");
        const second = await getMapSession("gee-sentinel-rgb");
        expect(second).toBe(first);
        expect(first.tileUrlTemplate).toContain("{z}/{x}/{y}");
        expect(first.expiresAt).toBeGreaterThan(Date.now());
    });

    it("rejects unknown presets", async () => {
        await expect(getMapSession("unknown-preset")).rejects.toThrow(/Unknown/);
    });
});
