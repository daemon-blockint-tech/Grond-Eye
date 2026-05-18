"use client";

import { useEffect } from "react";
import { useStore } from "@/core/state/store";

/**
 * Read-only authorization matrix: role, enabled plugins, and declared capabilities.
 */
export function AuthorizationPanel() {
    const snapshot = useStore((s) => s.opsAuthorization);
    const setOpsAuthorization = useStore((s) => s.setOpsAuthorization);

    useEffect(() => {
        if (snapshot) return;
        fetch("/api/ops/authorization")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) setOpsAuthorization(data);
            })
            .catch(() => {});
    }, [snapshot, setOpsAuthorization]);

    return (
      <div className="ops-panel-body" style={{ padding: "var(--space-md)", fontSize: 13 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Authorization</h3>
        {!snapshot && <p style={{ color: "var(--text-muted)" }}>Loading capabilities…</p>}
        {snapshot && (
        <>
          <p style={{ margin: "0 0 12px", color: "var(--text-muted)" }}>
            Role:
            {" "}
            <strong>{snapshot.role}</strong>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "4px 0" }}>Layer</th>
                <th>On</th>
                <th>Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.plugins.map((p) => (
                <tr key={p.pluginId} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "6px 4px 6px 0" }}>{p.name}</td>
                  <td>{p.enabled ? "Yes" : "No"}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {p.capabilities.length > 0 ? p.capabilities.join(", ") : "—"}
                  </td>
                </tr>
                        ))}
            </tbody>
          </table>
        </>
            )}
      </div>
    );
}
