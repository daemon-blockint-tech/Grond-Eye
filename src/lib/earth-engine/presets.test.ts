import { describe, expect, it } from "vitest";
import { EARTH_ENGINE_PRESET_IDS, isEarthEnginePresetId } from "./presets";

describe("earth-engine presets", () => {
    it("recognizes all registered preset ids", () => {
        for (const id of EARTH_ENGINE_PRESET_IDS) {
            expect(isEarthEnginePresetId(id)).toBe(true);
        }
    });

    it("rejects unknown ids", () => {
        expect(isEarthEnginePresetId("gee-unknown")).toBe(false);
    });
});
