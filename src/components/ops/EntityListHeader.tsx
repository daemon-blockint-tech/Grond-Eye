"use client";

import { Filter } from "lucide-react";
import { useStore } from "@/core/state/store";
import type { EntityGroupKey } from "./groupEntities";
import type { EntitySortKey } from "./sortEntities";

export interface EntityListHeaderProps {
    query: string;
    onQueryChange: (value: string) => void;
    sortBy: EntitySortKey;
    onSortChange: (value: EntitySortKey) => void;
    groupBy: EntityGroupKey;
    onGroupChange: (value: EntityGroupKey) => void;
    resultCount?: number;
}

/**
 * Assets list controls: search, sort, group, and filters shortcut.
 */
export function EntityListHeader({
    query,
    onQueryChange,
    sortBy,
    onSortChange,
    groupBy,
    onGroupChange,
    resultCount,
}: EntityListHeaderProps) {
    const setConfigPanelOpen = useStore((s) => s.setConfigPanelOpen);
    const setActiveConfigTab = useStore((s) => s.setActiveConfigTab);

    return (
      <div className="ops-entity-list__header">
        <div className="ops-entity-list__title-row">
          <h3 className="ops-entity-list__title">Assets</h3>
          {typeof resultCount === "number" && (
            <span className="ops-entity-list__count">
              {resultCount}
              {" "}
              {resultCount === 1 ? "result" : "results"}
            </span>
          )}
        </div>
        <input
          type="search"
          className="ops-entity-list__search"
          placeholder="Search by name or ID…"
          aria-label="Search assets"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <div className="ops-entity-list__controls">
          <label className="ops-entity-list__control">
            Sort
            <select
              className="ops-entity-list__select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as EntitySortKey)}
            >
              <option value="name">Name</option>
              <option value="plugin">Layer</option>
              <option value="updated">Last update</option>
            </select>
          </label>
          <label className="ops-entity-list__control">
            Group
            <select
              className="ops-entity-list__select"
              value={groupBy}
              onChange={(e) => onGroupChange(e.target.value as EntityGroupKey)}
            >
              <option value="none">None</option>
              <option value="plugin">Layer</option>
              <option value="disposition">Disposition</option>
            </select>
          </label>
          <button
            type="button"
            className="btn btn--glow ops-entity-list__filters-btn"
            onClick={() => {
                setConfigPanelOpen(true);
                setActiveConfigTab("filters");
            }}
          >
            <Filter size={14} />
            Filters
          </button>
        </div>
      </div>
    );
}
