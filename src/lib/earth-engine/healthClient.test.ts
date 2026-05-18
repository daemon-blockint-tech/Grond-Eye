import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    fetchEarthEngineConfigured,
    resetEarthEngineHealthCache,
} from "./healthClient";

const fetchMock = vi.fn();

beforeEach(() => {
    resetEarthEngineHealthCache();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("fetchEarthEngineConfigured", () => {
    it("caches the health response", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ configured: true }),
        });

        await expect(fetchEarthEngineConfigured()).resolves.toBe(true);
        await expect(fetchEarthEngineConfigured()).resolves.toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("returns false when health request fails", async () => {
        fetchMock.mockRejectedValue(new Error("network"));

        await expect(fetchEarthEngineConfigured()).resolves.toBe(false);
    });
});
