"use client";

import { useState } from "react";
import { CircuitBoard, Globe2, Search } from "lucide-react";
import { useStore } from "@/core/state/store";
import { pluginManager } from "@/core/plugins/PluginManager";
import { trackEvent } from "@/lib/analytics";
import { ImageryPicker } from "@/components/panels/ImageryPicker";
import { LayerItem } from "@/components/panels/LayerItem";

const CATEGORY_LABELS: Record<string, string> = {
    aviation: "Aviation",
    maritime: "Maritime",
    "natural-disaster": "Natural Disasters",
    conflict: "Conflict",
    infrastructure: "Infrastructure",
    cyber: "Cyber",
    economic: "Economic",
    custom: "Custom",
};

type OpsLayersSection = "data" | "imagery";

/**
 * Combined layers panel for /ops: data layer toggles and basemap imagery.
 */
export function OpsLayersPanel() {
    const layers = useStore((s) => s.layers);
    const entitiesByPlugin = useStore((s) => s.entitiesByPlugin);
    const highlightLayerId = useStore((s) => s.highlightLayerId);
    const setHighlightLayerId = useStore((s) => s.setHighlightLayerId);
    const setConfigPanelOpen = useStore((s) => s.setConfigPanelOpen);
    const setActiveConfigTab = useStore((s) => s.setActiveConfigTab);
    const setSelectedEntity = useStore((s) => s.setSelectedEntity);

    const [section, setSection] = useState<OpsLayersSection>("data");
    const [searchQuery, setSearchQuery] = useState("");

    const allPlugins = pluginManager.getAllPlugins();
    const query = searchQuery.toLowerCase();
    const grouped: Record<string, typeof allPlugins> = {};

    allPlugins.forEach((managed) => {
        if (
            !query
            || managed.plugin.name.toLowerCase().includes(query)
            || managed.plugin.description?.toLowerCase().includes(query)
            || managed.plugin.id.toLowerCase().includes(query)
        ) {
            const cat = managed.plugin.category;
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(managed);
        }
    });

    const handleToggle = (pluginId: string) => {
        const isEnabled = layers[pluginId]?.enabled;
        if (isEnabled) {
            pluginManager.disablePlugin(pluginId);
            useStore.getState().setLayerEnabled(pluginId, false);
            useStore.getState().clearEntities(pluginId);
            useStore.getState().setEntityCount(pluginId, 0);
            const state = useStore.getState();
            if (state.hoveredEntity?.pluginId === pluginId) {
                state.setHoveredEntity(null, null);
            }
            if (state.selectedEntity?.pluginId === pluginId) {
                state.setSelectedEntity(null);
            }
        } else {
            pluginManager.enablePlugin(pluginId);
            useStore.getState().setLayerEnabled(pluginId, true);
            useStore.getState().setHighlightLayerId(pluginId);
            useStore.getState().setSelectedEntity(null);
            useStore.getState().setConfigPanelOpen(true);
            const managed = pluginManager.getPlugin(pluginId);
            const settings = useStore.getState().dataConfig.pluginSettings[pluginId];
            if (managed?.plugin.requiresConfiguration?.(settings)) {
                useStore.getState().setActiveConfigTab("overlay");
            } else {
                useStore.getState().setActiveConfigTab("intel");
            }
        }
        trackEvent("layer-toggle", { layer: pluginId, enabled: !isEnabled });
    };

    const hasMatches = Object.keys(grouped).length > 0;

    return (
      <div className="ops-layers-panel" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div
          className="panel-tabs"
          style={{ padding: "0 var(--space-md)", flexShrink: 0, display: "flex", overflowX: "auto" }}
          onWheel={(e) => {
                    e.currentTarget.scrollLeft += e.deltaY;
                }}
        >
          <button
            type="button"
            className={`panel-tab ${section === "data" ? "panel-tab--active" : ""}`}
            onClick={() => setSection("data")}
            title="Data layers"
          >
            <CircuitBoard size={18} style={{ margin: 4 }} />
            <span style={{ fontSize: 11 }}>Data layers</span>
          </button>
          <button
            type="button"
            className={`panel-tab ${section === "imagery" ? "panel-tab--active" : ""}`}
            onClick={() => setSection("imagery")}
            title="Imagery"
          >
            <Globe2 size={18} style={{ margin: 4 }} />
            <span style={{ fontSize: 11 }}>Imagery</span>
          </button>
        </div>

        {section === "data" && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "var(--space-md)", flexShrink: 0 }}>
            <div
              style={{
                            display: "flex",
                            alignItems: "center",
                            background: "var(--bg-layer-2)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-sm)",
                            padding: "0 var(--space-sm)",
                        }}
            >
              <Search size={14} style={{ color: "var(--text-muted)", marginRight: 8 }} />
              <input
                type="search"
                placeholder="Search layers..."
                aria-label="Search data layers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-primary)",
                                    fontSize: 13,
                                    padding: "var(--space-sm) 0",
                                    outline: "none",
                                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", paddingBottom: "var(--space-md)" }}>
            {!hasMatches && (
            <p style={{ padding: "var(--space-md)", color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
              No layers match your search. Try another name or category.
            </p>
                    )}
            {Object.entries(grouped).map(([category, plugins]) => (
              <div key={category} style={{ marginBottom: "var(--space-lg)" }}>
                <div
                  style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: "var(--text-muted)",
                                        marginBottom: "var(--space-sm)",
                                        paddingLeft: "var(--space-md)",
                                    }}
                >
                  {CATEGORY_LABELS[category] || category}
                </div>
                {plugins.map((managed) => {
                                    const isEnabled = layers[managed.plugin.id]?.enabled || false;
                                    const isLoading = layers[managed.plugin.id]?.loading || false;
                                    const count = (entitiesByPlugin[managed.plugin.id] || []).length;

                                    return (
                                      <LayerItem
                                        key={managed.plugin.id}
                                        plugin={managed.plugin}
                                        isEnabled={isEnabled}
                                        isLoading={isLoading}
                                        entityCount={count}
                                        isSelected={highlightLayerId === managed.plugin.id}
                                        onToggle={() => handleToggle(managed.plugin.id)}
                                        onSelect={() => {
                                                const newId = highlightLayerId === managed.plugin.id ? null : managed.plugin.id;
                                                setHighlightLayerId(newId);
                                                if (newId) {
                                                    setSelectedEntity(null);
                                                    setConfigPanelOpen(true);
                                                    setActiveConfigTab("intel");
                                                }
                                            }}
                                      />
                                    );
                                })}
              </div>
                        ))}
          </div>
        </div>
            )}

        {section === "imagery" && (
        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-sm)" }}>
          <ImageryPicker />
        </div>
            )}
      </div>
    );
}
