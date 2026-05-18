"use client";

import { useStore } from "@/core/state/store";
import { dataBus } from "@/core/data/DataBus";
import { pluginManager } from "@/core/plugins/PluginManager";
import { flyToEntity } from "@/core/globe/flyToEntity";
import type { OpsAlert } from "@/core/state/slices/opsAlerts";

/**
 * Alerts panel — operational notifications with dismiss and map focus.
 */
export function AlertsPanel() {
    const alerts = useStore((s) => s.opsAlerts);
    const loading = useStore((s) => s.opsAlertsLoading);
    const removeOpsAlert = useStore((s) => s.removeOpsAlert);

    const dismiss = async (id: string) => {
        const res = await fetch(`/api/ops/alerts/${id}`, { method: "PATCH" });
        if (res.ok) removeOpsAlert(id);
    };

    const viewOnMap = (alert: OpsAlert) => {
        if (!alert.entityPluginId || !alert.entityId) return;
        const entities = pluginManager.getEntities(alert.entityPluginId);
        const entity = entities.find((e) => e.id === alert.entityId);
        if (entity) {
            useStore.getState().setSelectedEntity(entity);
            flyToEntity(entity);
            dataBus.emit("entitySelected", { entity });
        }
    };

    return (
      <div className="ops-panel-body" style={{ padding: "var(--space-md)", fontSize: 13 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Alerts</h3>
        {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}
        {!loading && alerts.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>No alerts. System and agent alerts will appear here.</p>
            )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {alerts.map((alert) => (
            <li
              key={alert.id}
              style={{
                        padding: "10px 0",
                        borderBottom: "1px solid var(--border-subtle)",
                    }}
            >
              <div style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            color: alert.severity === "critical"
                                ? "var(--accent-red, #ef4444)"
                                : alert.severity === "warn"
                                    ? "var(--accent-orange, #f59e0b)"
                                    : "var(--text-muted)",
                        }}
              >
                {alert.severity}
              </div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{alert.title}</div>
              {alert.body && (
              <p style={{ margin: "4px 0 8px", color: "var(--text-muted)", fontSize: 12 }}>{alert.body}</p>
                    )}
              <div style={{ display: "flex", gap: 8 }}>
                {alert.entityId && (
                <button type="button" className="btn" style={{ fontSize: 11 }} onClick={() => viewOnMap(alert)}>
                  View on map
                </button>
                    )}
                <button type="button" className="btn" style={{ fontSize: 11 }} onClick={() => void dismiss(alert.id)}>
                  Dismiss
                </button>
              </div>
            </li>
                    ))}
        </ul>
      </div>
    );
}
