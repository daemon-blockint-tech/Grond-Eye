import type { GeoEntity } from "@/core/plugins/PluginTypes";

export type EntityGroupKey = "none" | "plugin" | "disposition";

/**
 * Groups entities by plugin id or disposition label for the tracks list.
 */
export function groupEntities(
    entities: GeoEntity[],
    groupBy: EntityGroupKey,
): { key: string; label: string; entities: GeoEntity[] }[] {
    if (groupBy === "none") {
        return [{ key: "all", label: "All tracks", entities }];
    }

    const buckets = new Map<string, GeoEntity[]>();

    for (const entity of entities) {
        let key: string;
        if (groupBy === "plugin") {
            key = entity.pluginId;
        } else {
            const disposition = entity.properties?.disposition ?? entity.properties?.status;
            key = typeof disposition === "string" && disposition.length > 0 ? disposition : "Unknown";
        }
        const list = buckets.get(key) ?? [];
        list.push(entity);
        buckets.set(key, list);
    }

    return Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, ents]) => ({
            key,
            label: groupBy === "plugin" ? key : key,
            entities: ents,
        }));
}
