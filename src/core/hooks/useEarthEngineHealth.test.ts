import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useEarthEngineHealth } from "./useEarthEngineHealth";

describe("useEarthEngineHealth", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns true when health reports configured", async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ configured: true }),
        } as Response);

        const { result } = renderHook(() => useEarthEngineHealth());
        await waitFor(() => expect(result.current).toBe(true));
    });

    it("returns false when health request fails", async () => {
        vi.mocked(fetch).mockRejectedValue(new Error("network"));

        const { result } = renderHook(() => useEarthEngineHealth());
        await waitFor(() => expect(result.current).toBe(false));
    });
});
