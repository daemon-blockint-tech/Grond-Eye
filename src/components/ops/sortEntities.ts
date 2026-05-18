import type { GeoEntity } from "@/core/plugins/PluginTypes";

export type EntitySortKey = "name" | "plugin" | "updated";

/**
 * Returns a sorted copy of track entities for the ops list.
 */
export function sortEntities(entities: GeoEntity[], sortBy: EntitySortKey): GeoEntity[] {
    const copy = [...entities];
    copy.sort((a, b) => {
        if (sortBy === "plugin") {
            const pc = a.pluginId.localeCompare(b.pluginId);
            if (pc !== 0) return pc;
            return (a.label ?? a.id).localeCompare(b.label ?? b.id);
        }
        if (sortBy === "updated") {
            const ta = typeof a.properties?.timestamp === "number" ? a.properties.timestamp : 0;
            const tb = typeof b.properties?.timestamp === "number" ? b.properties.timestamp : 0;
            return tb - ta;
        }
        return (a.label ?? a.id).localeCompare(b.label ?? b.id);
    });
    return copy;
}
