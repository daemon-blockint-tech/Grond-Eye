import { describe, expect, it } from "vitest";
import { sortEntities } from "@/components/ops/sortEntities";
import type { GeoEntity } from "@/core/plugins/PluginTypes";

const base = (overrides: Partial<GeoEntity>): GeoEntity => ({
    id: "e1",
    pluginId: "p1",
    latitude: 0,
    longitude: 0,
    label: "Zulu",
    properties: {},
    timestamp: new Date(),
    ...overrides,
});

describe("sortEntities", () => {
    it("sorts by name", () => {
        const sorted = sortEntities([
            base({ label: "Zulu", id: "z" }),
            base({ label: "Alpha", id: "a" }),
        ], "name");
        expect(sorted[0].label).toBe("Alpha");
    });

    it("sorts by plugin then name", () => {
        const sorted = sortEntities([
            base({ pluginId: "b", label: "One" }),
            base({ pluginId: "a", label: "Two" }),
        ], "plugin");
        expect(sorted[0].pluginId).toBe("a");
    });
});
