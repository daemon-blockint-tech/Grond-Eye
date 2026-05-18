"use client";

import { X } from "lucide-react";
import { useStore } from "@/core/state/store";
import { pluginManager } from "@/core/plugins/PluginManager";
import { flyToEntity } from "@/core/globe/flyToEntity";
import { EntityListPanel } from "./EntityListPanel";
import { EntityDetailPanel } from "./EntityDetailPanel";
import { OpsLayersPanel } from "./OpsLayersPanel";
import { FavoritesTab } from "@/components/panels/FavoritesTab";
import { ImportPanel } from "@/plugins/geojson/ImportPanel";
import CameraStatsPanel from "@/components/panels/CameraStatsPanel";

const TAB_LABELS: Record<string, string> = {
    tracks: "Assets",
    layers: "Layers",
    assets: "Cameras",
    geo: "Geo entities",
    recent: "Recently viewed",
    starred: "Starred",
};

/**
 * Sliding left detail panel routed by active left tab.
 */
export function LeftDetailPanel() {
    const activeLeftTab = useStore((s) => s.activeLeftTab);
    const leftPanelOpen = useStore((s) => s.leftPanelOpen);
    const setLeftPanelOpen = useStore((s) => s.setLeftPanelOpen);
    const selectedEntity = useStore((s) => s.selectedEntity);
    const recentEntities = useStore((s) => s.recentEntities);
    const setSelectedEntity = useStore((s) => s.setSelectedEntity);
    const setActiveLeftTab = useStore((s) => s.setActiveLeftTab);
    const pushRecentEntityRef = useStore((s) => s.pushRecentEntityRef);

    if (!leftPanelOpen || !activeLeftTab) {
        return <div className="ops-left-detail ops-left-detail--closed" data-testid="left-panel-manager" aria-hidden />;
    }

    let body: React.ReactNode = null;
    if (selectedEntity && activeLeftTab === "tracks") {
        body = <EntityDetailPanel />;
    } else if (activeLeftTab === "tracks") {
        body = <EntityListPanel />;
    } else if (activeLeftTab === "layers") {
        body = <OpsLayersPanel />;
    } else if (activeLeftTab === "assets") {
        body = <CameraStatsPanel />;
    } else if (activeLeftTab === "geo") {
        body = (
          <div style={{ overflow: "auto", height: "100%" }}>
            <ImportPanel />
          </div>
        );
    } else if (activeLeftTab === "starred") {
        body = <FavoritesTab />;
    } else if (activeLeftTab === "recent") {
        const recent = recentEntities.slice(0, 20);
        body = (
          <div className="ops-stub-panel" style={{ padding: "var(--space-md)" }}>
            <h3 style={{ marginTop: 0 }}>Recently viewed</h3>
            {recent.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Nothing viewed yet. Select a track from the list or map.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {recent.map((ref) => {
                        const entities = pluginManager.getEntities(ref.pluginId);
                        const entity = entities.find((e) => e.id === ref.entityId);
                        const label = ref.label || entity?.label || ref.entityId;
                        return (
                          <li key={`${ref.pluginId}:${ref.entityId}`}>
                            <button
                              type="button"
                              disabled={!entity}
                              onClick={() => {
                                    if (!entity) return;
                                    setSelectedEntity(entity);
                                    pushRecentEntityRef(ref);
                                    flyToEntity(entity);
                                    setActiveLeftTab("tracks");
                                }}
                              style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 0",
                                    border: "none",
                                    borderBottom: "1px solid var(--border-subtle)",
                                    background: "transparent",
                                    color: entity ? "var(--text-primary)" : "var(--text-muted)",
                                    cursor: entity ? "pointer" : "default",
                                    fontSize: 13,
                                }}
                            >
                              {label}
                              {!entity && (
                              <span style={{ fontSize: 11, display: "block", color: "var(--text-muted)" }}>
                                (not on map)
                              </span>
                                    )}
                            </button>
                          </li>
                        );
                    })}
              </ul>
            )}
          </div>
        );
    }

    return (
      <aside
        className="ops-left-detail glass-panel"
        data-testid="left-panel-manager"
        aria-label={TAB_LABELS[activeLeftTab] ?? "Panel"}
        aria-expanded
      >
        <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px var(--space-md)",
                borderBottom: "1px solid var(--border-subtle)",
            }}
        >
          <span style={{ fontWeight: 600, fontSize: 13 }}>{TAB_LABELS[activeLeftTab]}</span>
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setLeftPanelOpen(false)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {body}
        </div>
      </aside>
    );
}
