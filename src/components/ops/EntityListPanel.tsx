"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/core/state/store";
import { pluginManager } from "@/core/plugins/PluginManager";
import type { GeoEntity } from "@/core/plugins/PluginTypes";
import { flyToEntity } from "@/core/globe/flyToEntity";
import { EntityListHeader } from "./EntityListHeader";
import { groupEntities, type EntityGroupKey } from "./groupEntities";
import { sortEntities, type EntitySortKey } from "./sortEntities";
import { isSimulatedEntity } from "@/lib/scenarios/entities";

/**
 * Assets-style entity list from enabled layers with sort and grouping.
 */
export function EntityListPanel() {
    const entitiesByPlugin = useStore((s) => s.entitiesByPlugin);
    const layers = useStore((s) => s.layers);
    const simOnlyFilter = useStore((s) => s.opsSimOnly);
    const setSelectedEntity = useStore((s) => s.setSelectedEntity);
    const pushRecentEntityRef = useStore((s) => s.pushRecentEntityRef);
    const setActiveLeftTab = useStore((s) => s.setActiveLeftTab);
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<EntitySortKey>("name");
    const [groupBy, setGroupBy] = useState<EntityGroupKey>("none");
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const entities = useMemo(() => {
        const list: GeoEntity[] = [];
        for (const [pluginId, ents] of Object.entries(entitiesByPlugin)) {
            if (!layers[pluginId]?.enabled) continue;
            for (const e of ents) {
                if (simOnlyFilter && !isSimulatedEntity(e)) continue;
                list.push(e);
            }
        }
        const q = query.trim().toLowerCase();
        const filtered = !q
            ? list
            : list.filter((e) =>
                e.id.toLowerCase().includes(q)
                || (e.label ?? "").toLowerCase().includes(q)
                || e.pluginId.toLowerCase().includes(q));
        return sortEntities(filtered, sortBy);
    }, [entitiesByPlugin, layers, query, sortBy, simOnlyFilter]);

    const groups = useMemo(() => groupEntities(entities, groupBy), [entities, groupBy]);

    const enabledLayerCount = Object.values(layers).filter((l) => l.enabled).length;

    const selectEntity = (entity: GeoEntity) => {
        setSelectedEntity(entity);
        pushRecentEntityRef({
            pluginId: entity.pluginId,
            entityId: entity.id,
            label: entity.label,
        });
        flyToEntity(entity);
        setActiveLeftTab("tracks");
    };

    return (
      <div className="ops-entity-list">
        <EntityListHeader
          query={query}
          onQueryChange={setQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          groupBy={groupBy}
          onGroupChange={setGroupBy}
          resultCount={entities.length}
        />
        <ul className="ops-entity-list__scroll">
          {entities.length === 0 && enabledLayerCount === 0 && (
          <li className="ops-entity-list__empty">
            No assets visible. Turn on a data layer or wait for live data.
          </li>
                )}
          {entities.length === 0 && enabledLayerCount > 0 && (
          <li className="ops-entity-list__empty">
            No assets in this view. Check filters or zoom the map.
          </li>
                )}
          {groups.map((group) => {
                    const collapsedGroup = collapsed[group.key] ?? false;
                    const headerLabel = groupBy === "plugin"
                        ? (pluginManager.getPlugin(group.key)?.plugin.name ?? group.key)
                        : group.label;

                    return (
                      <li key={group.key}>
                        {groupBy !== "none" && (
                        <button
                          type="button"
                          className="ops-entity-list__group-toggle"
                          onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !collapsedGroup }))}
                        >
                          {collapsedGroup ? "▸" : "▾"}
                          {" "}
                          {headerLabel}
                          {" "}
                          (
                          {group.entities.length}
                          )
                        </button>
                            )}
                        {!collapsedGroup && group.entities.map((entity) => {
                                const plugin = pluginManager.getPlugin(entity.pluginId)?.plugin;
                                return (
                                  <li key={`${entity.pluginId}:${entity.id}`}>
                                    <button
                                      type="button"
                                      className="ops-entity-list__row"
                                      onClick={() => selectEntity(entity)}
                                    >
                                      <div className="ops-entity-list__row-label">{entity.label || entity.id}</div>
                                      <div className="ops-entity-list__row-meta">
                                        {plugin?.name ?? entity.pluginId}
                                        {isSimulatedEntity(entity) ? " · Simulated" : ""}
                                      </div>
                                    </button>
                                  </li>
                                );
                            })}
                      </li>
                    );
                })}
        </ul>
      </div>
    );
}
