import { describe, expect, it } from "vitest";
import { groupEntities } from "@/components/ops/groupEntities";
import type { GeoEntity } from "@/core/plugins/PluginTypes";

const base = (overrides: Partial<GeoEntity>): GeoEntity => ({
    id: "e1",
    pluginId: "p1",
    latitude: 0,
    longitude: 0,
    label: "Alpha",
    properties: {},
    timestamp: new Date(),
    ...overrides,
});

describe("groupEntities", () => {
    it("returns single group when groupBy is none", () => {
        const entities = [base({ id: "a" }), base({ id: "b" })];
        const groups = groupEntities(entities, "none");
        expect(groups).toHaveLength(1);
        expect(groups[0].entities).toHaveLength(2);
    });

    it("groups by plugin id", () => {
        const entities = [
            base({ id: "a", pluginId: "aviation" }),
            base({ id: "b", pluginId: "maritime" }),
            base({ id: "c", pluginId: "aviation" }),
        ];
        const groups = groupEntities(entities, "plugin");
        expect(groups).toHaveLength(2);
        expect(groups.find((g) => g.key === "aviation")?.entities).toHaveLength(2);
    });

    it("groups by disposition with Unknown fallback", () => {
        const entities = [
            base({ id: "a", properties: { disposition: "hostile" } }),
            base({ id: "b", properties: {} }),
        ];
        const groups = groupEntities(entities, "disposition");
        expect(groups.some((g) => g.key === "hostile")).toBe(true);
        expect(groups.some((g) => g.key === "Unknown")).toBe(true);
    });
});
