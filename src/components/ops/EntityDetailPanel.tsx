"use client";

import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useStore } from "@/core/state/store";
import { pluginManager } from "@/core/plugins/PluginManager";
import { PluginIcon } from "@/components/common/PluginIcon";
import { DynamicPropertiesRender } from "@/components/panels/properties/DynamicPropertiesRender";

/**
 * Track detail view in the left panel for a selected entity.
 */
export function EntityDetailPanel() {
    const selectedEntity = useStore((s) => s.selectedEntity);
    const setSelectedEntity = useStore((s) => s.setSelectedEntity);
    const upsertOpsTask = useStore((s) => s.upsertOpsTask);
    const [creating, setCreating] = useState(false);

    if (!selectedEntity) {
        return (
          <div className="ops-stub-panel">
            <h3>Track detail</h3>
            <p>Select a track from the list to view details.</p>
          </div>
        );
    }

    const managed = pluginManager.getPlugin(selectedEntity.pluginId);

    const createTask = async () => {
        setCreating(true);
        try {
            const res = await fetch("/api/ops/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Follow up: ${selectedEntity.label || selectedEntity.id}`,
                    entityPluginId: selectedEntity.pluginId,
                    entityId: selectedEntity.id,
                    lat: selectedEntity.latitude,
                    lon: selectedEntity.longitude,
                }),
            });
            if (!res.ok) {
                alert("Could not save task. Check your connection and try again.");
                return;
            }
            const data = await res.json();
            if (data.task) upsertOpsTask(data.task);
        } finally {
            setCreating(false);
        }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-md)",
                borderBottom: "1px solid var(--border-subtle)",
            }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              aria-label="Back to tracks"
              onClick={() => setSelectedEntity(null)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
            >
              <ChevronLeft size={18} />
            </button>
            {managed?.plugin.icon && (
              <PluginIcon icon={managed.plugin.icon} size={20} />
            )}
            <h3 style={{ margin: 0, fontSize: 14 }}>{selectedEntity.label || selectedEntity.id}</h3>
          </div>
          <button
            type="button"
            aria-label="Close detail"
            onClick={() => setSelectedEntity(null)}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "var(--space-md)", fontSize: 13, flex: 1, overflow: "auto" }}>
          <p style={{ margin: "0 0 12px", color: "var(--text-muted)" }}>
            {managed?.plugin.name ?? selectedEntity.pluginId}
          </p>
          <DynamicPropertiesRender entity={selectedEntity} classNamePrefix="ops-detail" />
          <button
            type="button"
            className="btn btn--glow"
            disabled={creating}
            onClick={() => void createTask()}
            style={{ marginTop: 16 }}
          >
            {creating ? "Saving…" : "Create task"}
          </button>
        </div>
      </div>
    );
}
