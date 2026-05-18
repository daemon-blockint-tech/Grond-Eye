"use client";

import { Layers } from "lucide-react";
import { SearchBar } from "@/components/layout/SearchBar";
import { useStore } from "@/core/state/store";

/**
 * In-map toolbar with search and layer shortcut.
 */
export function MapToolbar() {
    const toggleLeftTab = useStore((s) => s.toggleLeftTab);

    return (
      <div className="ops-map-toolbar glass-panel" data-testid="cop-panel-toolbar">
        <button
          type="button"
          className="btn btn--glow"
          title="Layers"
          aria-label="Open layers"
          onClick={() => toggleLeftTab("layers")}
          style={{ padding: 6 }}
        >
          <Layers size={16} />
        </button>
        <SearchBar />
      </div>
    );
}
